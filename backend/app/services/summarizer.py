"""Two-stage async document summariser: map (per-chunk) → reduce (final).

Chunk summaries are produced with bounded concurrency so local LLM servers are
not flooded with simultaneous generation requests.
"""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

from app.logging_config import get_logger, log_chunk_progress, log_pipeline_stage
from app.services.prompt_loader import load_prompt
from app.services.text_chunker import TextChunker

if TYPE_CHECKING:
    from app.services.llm_client import AsyncLLMClient


class Summarizer:
    """Async two-stage document summariser."""

    def __init__(
        self,
        llm_client: "AsyncLLMClient | None" = None,
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

    # ------------------------------------------------------------------ #
    # Dependency injection helpers (for use in FastAPI Depends)
    # ------------------------------------------------------------------ #
    def set_llm_client(self, client: "AsyncLLMClient") -> None:
        self._llm_client = client

    # ------------------------------------------------------------------ #
    # Synchronous chunking (pure, no I/O)
    # ------------------------------------------------------------------ #
    def chunk_document(self, text: str, chunk_size: int | None = None, overlap: int | None = None) -> list[str]:
        size = chunk_size if chunk_size is not None else self.chunk_size
        ov = overlap if overlap is not None else self.overlap
        return self._text_chunker.chunk_text(text, chunk_size=size, overlap=ov)

    def should_summarize_directly(self, text: str) -> bool:
        return len(text) <= self.direct_summary_char_limit

    # ------------------------------------------------------------------ #
    # Output cleaning (matches original _clean_output behaviour)
    # ------------------------------------------------------------------ #
    @staticmethod
    def _clean_output(text: str) -> str:
        """Mirror the original Summarizer._clean_output for output parity."""
        cleaned = text.strip()
        cleaned = cleaned.replace("\u2022", "\n- ")
        cleaned = cleaned.replace("\u2219", "\n- ")
        cleaned = cleaned.replace("●", "\n- ")
        cleaned = cleaned.replace("•", "\n- ")
        cleaned = cleaned.replace("  ", " ")

        lines = [line.rstrip() for line in cleaned.splitlines()]
        normalized_lines: list[str] = []
        for line in lines:
            stripped = line.strip()
            if not stripped:
                if normalized_lines and normalized_lines[-1] != "":
                    normalized_lines.append("")
                continue
            if stripped.startswith("-") and len(stripped) > 1:
                normalized_lines.append(f"- {stripped.lstrip('- ').strip()}")
            else:
                normalized_lines.append(stripped)
        return "\n".join(normalized_lines).strip()

    # ------------------------------------------------------------------ #
    # Async map-reduce pipeline
    # ------------------------------------------------------------------ #
    async def summarize_document(
        self,
        text: str,
        session_id: int | None = None,
        chunk_size: int | None = None,
        overlap: int | None = None,
    ) -> str:
        """Summarise directly for small docs, otherwise use map-reduce."""
        if self.should_summarize_directly(text):
            return await self._summarize_direct(text, session_id=session_id)

        chunks = self.chunk_document(text, chunk_size=chunk_size, overlap=overlap)
        return await self.summarize_chunks(chunks, session_id=session_id)

    async def summarize_direct(self, text: str, session_id: int | None = None) -> str:
        return await self._summarize_direct(text, session_id=session_id)

    async def summarize_chunks(self, chunks: list[str], session_id: int | None = None) -> str:
        """Full async pipeline from precomputed chunks: map → reduce."""
        if not chunks:
            return ""

        log_pipeline_stage(self._log, "chunking", session_id=session_id, num_chunks=len(chunks))
        self._log.info("  Document split into %d chunks", len(chunks))

        chunk_summaries = await self._map_summaries(chunks, session_id=session_id)
        log_pipeline_stage(self._log, "reducing", session_id=session_id)

        final_summary = await self._reduce(chunk_summaries)
        log_pipeline_stage(self._log, "done", session_id=session_id, summary_len=len(final_summary))
        return final_summary

    async def _map_summaries(self, chunks: list[str], session_id: int | None = None) -> list[str]:
        """Send chunk summarisation prompts with bounded concurrency."""
        self._log.info(
            "→ Starting summarisation of %d chunks with concurrency=%d",
            len(chunks),
            self.max_concurrency,
        )
        log_pipeline_stage(self._log, "map_stage", session_id=session_id, total_chunks=len(chunks))

        semaphore = asyncio.Semaphore(self.max_concurrency)

        async def run_chunk(chunk: str, idx: int) -> str:
            async with semaphore:
                return await self._summarize_single_chunk(chunk, idx, total=len(chunks), session_id=session_id)

        tasks = [run_chunk(chunk, idx) for idx, chunk in enumerate(chunks)]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        summaries: list[str] = []
        for idx, result in enumerate(results):
            if isinstance(result, Exception):
                self._log.error("Chunk %d summarisation failed: %s", idx, result)
                summaries.append("")
            else:
                summaries.append(result)
            log_chunk_progress(self._log, idx + 1, len(chunks))

        self._log.info("← Map stage complete: %d/%d successful", sum(1 for s in summaries if s), len(chunks))
        return summaries

    async def _summarize_single_chunk(
        self, chunk: str, idx: int, total: int, session_id: int | None = None
    ) -> str:
        """Summarise one chunk and log the exchange."""
        if self._llm_client is None:
            raise RuntimeError("LLM client not set on Summarizer")

        prompt = self._chunk_prompt_template.replace("{{content}}", chunk)
        return await self._llm_client.complete(prompt, max_tokens=self.summary_max_tokens, chunk_index=idx)

    async def _summarize_direct(self, text: str, session_id: int | None = None) -> str:
        """Summarise a small document in one LLM call."""
        if self._llm_client is None:
            raise RuntimeError("LLM client not set on Summarizer")

        log_pipeline_stage(self._log, "direct_summary", session_id=session_id, text_len=len(text))
        prompt = self._chunk_prompt_template.replace("{{content}}", text)
        result = await self._llm_client.complete(prompt, max_tokens=self.summary_max_tokens, chunk_index=None)
        return self._clean_output(result) if result else ""

    async def _reduce(self, chunk_summaries: list[str]) -> str:
        """Reduce all chunk summaries into one final summary."""
        filtered = [s.strip() for s in chunk_summaries if s.strip()]
        if not filtered:
            return ""

        prompt = self._reduce_prompt_template.replace("{{content}}", "\n\n".join(filtered))
        result = await self._llm_client.complete(prompt, max_tokens=self.reduce_max_tokens, chunk_index=None) if self._llm_client else ""
        return self._clean_output(result) if result else ""
