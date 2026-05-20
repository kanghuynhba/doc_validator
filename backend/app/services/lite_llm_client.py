"""Async LLM client backed by LiteLLM."""

from __future__ import annotations

import asyncio
import json
import os
import re
import time
from typing import Any

os.environ.setdefault("LITELLM_LOCAL_MODEL_COST_MAP", "True")

import litellm

from app.config import get_settings
from app.logging_config import get_logger
from app.utils.text_utils import deduplicate_lines, normalize_output

_MAX_RETRIES = 3
_INITIAL_BACKOFF = 2.0


litellm.suppress_debug_info = True


class LiteLLMClient:
    """Async, logging-aware LLM client using LiteLLM's completion API."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._log = get_logger(__name__)

    @property
    def model_name(self) -> str:
        return self._settings.generative_model_name or self._settings.openai_model

    def _litellm_model_name(self) -> str:
        if self.model_name.startswith("openai/"):
            return self.model_name
        return f"openai/{self.model_name}"

    def _build_completion_args(self, prompt: str, max_tokens: int) -> dict[str, Any]:
        return {
            "model": self._litellm_model_name(),
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self._settings.llm_temperature,
            "max_tokens": max_tokens,
            "timeout": 180.0,
            "api_base": self._settings.github_endpoint or "http://127.0.0.1:8081/v1",
            "api_key": self._settings.github_completion_api_key or self._settings.openai_api_key or "local",
        }

    @staticmethod
    def _response_content(response: Any) -> str:
        choices = getattr(response, "choices", None)
        if choices and len(choices) > 0:
            message = getattr(choices[0], "message", None)
            content = getattr(message, "content", "") if message else ""
            if content:
                return str(content)

        if hasattr(response, "model_dump"):
            raw = response.model_dump()
        elif isinstance(response, dict):
            raw = response
        else:
            raw = {}

        return str(raw.get("choices", [{}])[0].get("message", {}).get("content", ""))

    async def complete(self, prompt: str, *, max_tokens: int = 1200, chunk_index: int | None = None) -> str:
        last_exception: Exception | None = None
        for attempt in range(_MAX_RETRIES):
            try:
                response = await litellm.acompletion(**self._build_completion_args(prompt, max_tokens))
            except Exception as exc:
                last_exception = exc
                wait = _INITIAL_BACKOFF * (2 ** attempt)
                self._log.warning(
                    "LLM request failed (attempt %d/%d), retrying in %.1fs: %s  chunk=%s",
                    attempt + 1, _MAX_RETRIES, wait, exc, chunk_index,
                )
                await asyncio.sleep(wait)
                continue

            return self._response_content(response).strip()

        self._log.warning(
            "LLM request failed after %d retries, using fallback: %s  chunk=%s",
            _MAX_RETRIES, last_exception, chunk_index,
        )
        return self._fallback_text(prompt)

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

    @staticmethod
    def _fallback_text(prompt: str) -> str:
        source = prompt.split("CONTENT:", 1)[-1].strip() if "CONTENT:" in prompt else prompt
        lines = [line.strip() for line in source.splitlines() if line.strip()]

        if lines and any(line.startswith(("Section:", "#", "Key ideas:", "Details:")) for line in lines):
            kept: list[str] = []
            for line in lines:
                if line.startswith(("Section:", "#", "Key ideas:", "Details:")):
                    kept.append(line)
                elif line.startswith(("- ", "• ")) or bool(re.match(r"^\d+[\).\:-]\s+", line)):
                    kept.append(line)
                if len(kept) >= 18:
                    break
            if kept:
                return normalize_output("\n".join(deduplicate_lines(kept, max_lines=18)))

        paragraphs = [para.strip() for para in source.split("\n\n") if para.strip()]
        if paragraphs:
            snippets = []
            for paragraph in paragraphs[:4]:
                sentences = re.split(r"(?<=[.!?])\s+", paragraph)
                snippets.append(" ".join(sentences[:2]).strip())
            summary = "\n\n".join(snippets).strip()
            if summary:
                return normalize_output(summary)

        words = source.split()
        return normalize_output(" ".join(words[:180]) or "No summary could be generated.")

    @staticmethod
    def _fallback_quiz(prompt: str) -> list[dict[str, Any]]:
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
        return None
