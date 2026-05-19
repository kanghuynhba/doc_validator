"""Async quiz generator with structured logging of every prompt sent and response received."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from app.logging_config import get_logger, log_prompt, log_response
from app.schemas.quiz import QuizQuestionCreate

if TYPE_CHECKING:
    from app.services.llm_client import AsyncLLMClient


class QuizGenerator:
    """Async quiz generator.  Set the client via set_llm_client()."""

    def __init__(self, llm_client: "AsyncLLMClient | None" = None) -> None:
        self._llm_client = llm_client
        self._log = get_logger(__name__)

    def set_llm_client(self, client: "AsyncLLMClient") -> None:
        self._llm_client = client

    async def generate_quiz_async(
        self, content: str, num_questions: int = 10, session_id: int | None = None
    ) -> list[QuizQuestionCreate]:
        """Generate quiz questions asynchronously with full prompt/response logging."""
        if self._llm_client is None:
            raise RuntimeError("LLM client not set on QuizGenerator")

        prompt = (
            f"Create {num_questions} multiple-choice questions from the content. "
            "Return only strict JSON array items with keys question, choices, correct_answer, explanation. "
            "choices must contain A, B, C, D. correct_answer must be A, B, C, or D.\n\nCONTENT:\n"
            f"{content}"
        )
        self._log.info("→ Quiz generation request  session_id=%s  num_questions=%d  content_len=%d", session_id, num_questions, len(content))
        log_prompt(self._log, chunk_index=None, prompt=prompt, max_chars=300)

        raw_questions = await self._llm_client.complete_json(
            prompt, max_tokens=2000, chunk_index=None
        )

        if not isinstance(raw_questions, list):
            self._log.warning("Unexpected LLM quiz response type: %s", type(raw_questions).__name__)
            raw_questions = []

        validated = []
        for item in raw_questions[:num_questions]:
            try:
                validated.append(QuizQuestionCreate.model_validate(item))
            except Exception as exc:
                self._log.warning("Skipping malformed quiz question: %s  (%s)", item, exc)

        self._log.info("← Quiz generation complete  session_id=%s  returned=%d/%d", session_id, len(validated), num_questions)
        return validated

    # Synchronous wrapper kept for backwards compatibility
    def generate_quiz(self, content: str, num_questions: int = 10) -> list[QuizQuestionCreate]:
        """Blocking wrapper — prefer generate_quiz_async."""
        if self._llm_client is None:
            raise RuntimeError("LLM client not set on QuizGenerator")
        import asyncio
        return asyncio.run(self.generate_quiz_async(content, num_questions))
