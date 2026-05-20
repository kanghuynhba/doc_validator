"""Two-stage async document summariser."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

from app.logging_config import get_logger
from app.services.prompt_loader import load_prompt
from app.services.text_chunker import TextChunker
from app.utils.text_utils import normalize_output

if TYPE_CHECKING:
    from app.services.lite_llm_client import LiteLLMClient


class Summarizer:
    """Async two-stage document summariser."""

    def __init__(
        self,
        llm_client: "LiteLLMClient | None" = None,
        text_chunker: TextChunker | None = None,
        chunk_size: int = 1000,
        overlap: int = 100,
        direct_summary_char_limit: int = 30000,
        max_concurrency: int = 1,
        summary_max_tokens: int = 900,
        reduce_max_tokens: int = 1000,
    ) -> None:
        self._llm_client = llm_client
        self._text_chunker = text_chunker or TextChunker()
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.direct_summary_char_limit = direct_summary_char_limit
        self.max_concurrency = max(1, max_concurrency)
        self.summary_max_tokens = summary_max_tokens
        self.reduce_max_tokens = reduce_max_tokens
        self._chunk_prompt_template = load_prompt("summarizer_chunk.txt")
        self._reduce_prompt_template = load_prompt("summarizer_reduce.txt")
        self._log = get_logger(__name__)

    def set_llm_client(self, client: "LiteLLMClient") -> None:
        self._llm_client = client

    def chunk_document(self, text: str, chunk_size: int | None = None, overlap: int | None = None) -> list[str]:
        size = chunk_size if chunk_size is not None else self.chunk_size
        ov = overlap if overlap is not None else self.overlap
        return self._text_chunker.chunk_text(text, chunk_size=size, overlap=ov)

    def should_summarize_directly(self, text: str) -> bool:
        return len(text) <= self.direct_summary_char_limit

    async def summarize_document(
        self,
        text: str,
        session_id: int | None = None,
        chunk_size: int | None = None,
        overlap: int | None = None,
    ) -> str:
        if self.should_summarize_directly(text):
            return await self._summarize_direct(text, session_id=session_id)

        chunks = self.chunk_document(text, chunk_size=chunk_size, overlap=overlap)
        return await self.summarize_chunks(chunks, session_id=session_id)

    async def summarize_direct(self, text: str, session_id: int | None = None) -> str:
        return await self._summarize_direct(text, session_id=session_id)

    async def summarize_chunks(self, chunks: list[str], session_id: int | None = None) -> str:
        if not chunks:
            return ""

        chunk_summaries = await self._map_summaries(chunks, session_id=session_id)
        return await self._reduce(chunk_summaries)

    async def _map_summaries(self, chunks: list[str], session_id: int | None = None) -> list[str]:
        semaphore = asyncio.Semaphore(self.max_concurrency)

        async def run_chunk(chunk: str, idx: int) -> str:
            async with semaphore:
                return await self._summarize_single_chunk(chunk, idx)

        tasks = [run_chunk(chunk, idx) for idx, chunk in enumerate(chunks)]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        summaries: list[str] = []
        for idx, result in enumerate(results):
            if isinstance(result, Exception):
                self._log.error("Chunk %d summarisation failed: %s", idx, result)
                summaries.append("")
            else:
                summaries.append(result)

        return summaries

    async def _summarize_single_chunk(self, chunk: str, idx: int) -> str:
        if self._llm_client is None:
            raise RuntimeError("LLM client not set on Summarizer")

        prompt = self._chunk_prompt_template.replace("{{content}}", chunk)
        return await self._llm_client.complete(prompt, max_tokens=self.summary_max_tokens, chunk_index=idx)

    async def _summarize_direct(self, text: str, session_id: int | None = None) -> str:
        if self._llm_client is None:
            raise RuntimeError("LLM client not set on Summarizer")

        prompt = self._chunk_prompt_template.replace("{{content}}", text)
        result = await self._llm_client.complete(prompt, max_tokens=self.summary_max_tokens, chunk_index=None)
        return normalize_output(result) if result else ""

    async def _reduce(self, chunk_summaries: list[str]) -> str:
        filtered = [s.strip() for s in chunk_summaries if s.strip()]
        if not filtered:
            return ""

        prompt = self._reduce_prompt_template.replace("{{content}}", "\n\n".join(filtered))
        result = await self._llm_client.complete(prompt, max_tokens=self.reduce_max_tokens, chunk_index=None) if self._llm_client else ""
        return normalize_output(result) if result else ""
