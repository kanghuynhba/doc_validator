"""Two-stage async document summariser: map (per-chunk) → reduce (final).

Chunk summaries are produced concurrently using asyncio.gather so the total
LLM round-trip time is close to the latency of a single chunk rather than
the sum of all chunks.
"""

from __future__ import annotations

import asyncio
import logging
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
    ) -> None:
        self._llm_client = llm_client
        self._text_chunker = text_chunker or TextChunker()
        self.chunk_size = chunk_size
        self.overlap = overlap
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
        """Full async pipeline: chunk → map → reduce."""
        chunks = self.chunk_document(text, chunk_size=chunk_size, overlap=overlap)
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
        """Send all chunk summarisation prompts concurrently."""
        self._log.info("→ Starting parallel summarisation of %d chunks", len(chunks))
        log_pipeline_stage(self._log, "map_stage", session_id=session_id, total_chunks=len(chunks))

        tasks = [
            self._summarize_single_chunk(chunk, idx, total=len(chunks), session_id=session_id)
            for idx, chunk in enumerate(chunks)
        ]
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
        return await self._llm_client.complete(prompt, max_tokens=700, chunk_index=idx)

    async def _reduce(self, chunk_summaries: list[str]) -> str:
        """Reduce all chunk summaries into one final summary."""
        filtered = [s.strip() for s in chunk_summaries if s.strip()]
        if not filtered:
            return ""

        prompt = self._reduce_prompt_template.replace("{{content}}", "\n\n".join(filtered))
        result = await self._llm_client.complete(prompt, max_tokens=2000, chunk_index=None) if self._llm_client else ""
        return self._clean_output(result) if result else ""
