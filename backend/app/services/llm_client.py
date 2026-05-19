"""Async LLM client wrapping OpenAI-compatible endpoints.

Supports both OpenAI and GitHub Models endpoints.  Every prompt sent and
response received is traced through the structured logger so the console shows
the exact flow of a document through the pipeline.
"""

from __future__ import annotations

import asyncio
import httpx
import json
import time
from typing import Any

from app.config import get_settings
from app.logging_config import get_logger, log_prompt, log_response
from app.utils.text_utils import deduplicate_lines, normalize_output

# Number of retry attempts before falling back to deterministic text generation.
_MAX_RETRIES = 3
# Initial backoff delay in seconds before the first retry (doubles each retry).
_INITIAL_BACKOFF = 2.0


class AsyncLLMClient:
    """Async, logging-aware LLM client with OpenAI-compatible API support."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._client: httpx.AsyncClient | None = None
        self._log = get_logger(__name__)

    # ------------------------------------------------------------------ #
    # Internal helpers
    # ------------------------------------------------------------------ #
    def _build_client(self) -> httpx.AsyncClient:
        api_key = self._settings.github_completion_api_key or self._settings.openai_api_key
        base_url = self._settings.github_endpoint
        timeout = httpx.Timeout(60.0, connect=10.0)
        headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
        return httpx.AsyncClient(base_url=base_url, timeout=timeout, headers=headers)

    @property
    def model_name(self) -> str:
        return self._settings.generative_model_name or self._settings.openai_model

    # ------------------------------------------------------------------ #
    # Core API
    # ------------------------------------------------------------------ #
    async def complete(self, prompt: str, *, max_tokens: int = 1200, chunk_index: int | None = None) -> str:
        log_prompt(self._log, chunk_index, prompt)
        start = time.perf_counter()

        if self._client is None:
            self._client = self._build_client()

        last_exception: Exception | None = None
        for attempt in range(_MAX_RETRIES):
            try:
                if self._client is None:
                    raise RuntimeError("httpx client not initialised")
                response = await self._client.post(
                    "/chat/completions",
                    json={
                        "model": self.model_name,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": self._settings.llm_temperature,
                        "max_tokens": max_tokens,
                    },
                )

                # 429 Rate-Limited: retry with backoff instead of immediately falling back.
                if response.status_code == 429:
                    response.close()
                    wait = _INITIAL_BACKOFF * (2 ** attempt)
                    self._log.warning(
                        "LLM rate-limited (429), retry %d/%d in %.1fs: chunk=%s",
                        attempt + 1, _MAX_RETRIES, wait, chunk_index,
                    )
                    await asyncio.sleep(wait)
                    continue

                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 429:
                    response.close()
                    wait = _INITIAL_BACKOFF * (2 ** attempt)
                    self._log.warning(
                        "LLM rate-limited (429), retry %d/%d in %.1fs: chunk=%s",
                        attempt + 1, _MAX_RETRIES, wait, chunk_index,
                    )
                    await asyncio.sleep(wait)
                    continue
                raise

            except Exception as exc:
                last_exception = exc
                wait = _INITIAL_BACKOFF * (2 ** attempt)
                self._log.warning(
                    "LLM request failed (attempt %d/%d), retrying in %.1fs: %s  chunk=%s",
                    attempt + 1, _MAX_RETRIES, wait, exc, chunk_index,
                )
                await asyncio.sleep(wait)
                continue

            # Success path.
            elapsed = time.perf_counter() - start
            raw = response.json()
            content: str = raw.get("choices", [{}])[0].get("message", {}).get("content", "")
            result = content.strip()
            log_response(self._log, chunk_index, result, elapsed)
            return result

        # All retries exhausted — fall back to deterministic generation.
        elapsed = time.perf_counter() - start
        self._log.warning(
            "LLM request failed after %d retries, using fallback: %s  chunk=%s",
            _MAX_RETRIES, last_exception, chunk_index,
        )
        result = self._fallback_text(prompt)
        log_response(self._log, chunk_index, result, elapsed)
        return result

    async def complete_json(
        self, prompt: str, *, max_tokens: int = 2000, chunk_index: int | None = None
    ) -> Any:
        start = time.perf_counter()
        text = await self.complete(prompt, max_tokens=max_tokens, chunk_index=chunk_index)
        elapsed = time.perf_counter() - start

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            self._log.warning("JSON parse failed, trying extraction heuristic (elapsed=%.2fs)", elapsed)
            start_pos = text.find("[")
            end_pos = text.rfind("]")
            if start_pos != -1 and end_pos != -1 and end_pos > start_pos:
                return json.loads(text[start_pos : end_pos + 1])
            return self._fallback_quiz(prompt)

    # ------------------------------------------------------------------ #
    # Fallbacks (deterministic, no LLM required)
    # ------------------------------------------------------------------ #
    @staticmethod
    def _fallback_text(prompt: str) -> str:
        source = prompt.split("CONTENT:", 1)[-1].strip() if "CONTENT:" in prompt else prompt
        lines = [line.strip() for line in source.splitlines() if line.strip()]

        if lines and any(line.startswith(("Section:", "#", "Key ideas:", "Details:")) for line in lines):
            kept: list[str] = []
            for line in lines:
                if line.startswith(("Section:", "#", "Key ideas:", "Details:")):
                    kept.append(line)
                elif line.startswith(("- ", "• ")) or bool(__import__("re").match(r"^\d+[\).\:-]\s+", line)):
                    kept.append(line)
                if len(kept) >= 18:
                    break
            if kept:
                return normalize_output("\n".join(deduplicate_lines(kept, max_lines=18)))

        paragraphs = [para.strip() for para in source.split("\n\n") if para.strip()]
        if paragraphs:
            snippets = []
            for paragraph in paragraphs[:4]:
                sentences = __import__("re").split(r"(?<=[.!?])\s+", paragraph)
                snippets.append(" ".join(sentences[:2]).strip())
            summary = "\n\n".join(snippets).strip()
            if summary:
                return normalize_output(summary)

        words = source.split()
        return normalize_output(" ".join(words[:180]) or "No summary could be generated.")

    @staticmethod
    def _fallback_quiz(prompt: str) -> list[dict[str, Any]]:
        import re
        content = prompt.split("CONTENT:", 1)[-1].strip()
        snippets = [s.strip() for s in content.replace("\n", " ").split(".") if s.strip()]
        questions = []
        for idx in range(5):
            basis = snippets[idx % len(snippets)] if snippets else "the uploaded document"
            questions.append(
                {
                    "question": f"Which option best reflects this document point: {basis[:120]}?",
                    "choices": {
                        "A": basis[:160] or "A key document idea",
                        "B": "An unrelated statement",
                        "C": "A minor formatting detail",
                        "D": "A source citation only",
                    },
                    "correct_answer": "A",
                    "explanation": "Option A is derived from the processed document content.",
                }
            )
        return questions

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None
