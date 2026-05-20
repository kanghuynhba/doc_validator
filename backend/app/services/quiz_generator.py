"""Async quiz generator with structured logging of every prompt sent and response received."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from app.config import get_settings
from app.logging_config import get_logger, log_prompt
from app.schemas.quiz import QuizQuestionCreate
from app.services.prompt_loader import load_prompt

if TYPE_CHECKING:
    from app.services.llm_client import AsyncLLMClient


class QuizGenerator:
    """Async quiz generator.  Set the client via set_llm_client()."""

    def __init__(self, llm_client: "AsyncLLMClient | None" = None) -> None:
        self._llm_client = llm_client
        self._log = get_logger(__name__)
        self._settings = get_settings()
        self._prompt_template = load_prompt("quiz_generator.txt")

    def set_llm_client(self, client: "AsyncLLMClient") -> None:
        self._llm_client = client

    async def generate_quiz_async(
        self, content: str, num_questions: int = 10, session_id: int | None = None
    ) -> list[QuizQuestionCreate]:
        """Generate quiz questions asynchronously with full prompt/response logging."""
        if self._llm_client is None:
            raise RuntimeError("LLM client not set on QuizGenerator")

        prompt = self._prompt_template.format(num_questions=num_questions, content=content)
        self._log.info("→ Quiz generation request  session_id=%s  num_questions=%d  content_len=%d", session_id, num_questions, len(content))
        log_prompt(self._log, chunk_index=None, prompt=prompt, max_chars=300)

        raw_questions = await self._llm_client.complete_json(
            prompt, max_tokens=self._settings.quiz_max_tokens, chunk_index=None
        )

        if not isinstance(raw_questions, list):
            self._log.warning("Unexpected LLM quiz response type: %s", type(raw_questions).__name__)
            raw_questions = []

        validated = []
        for item in raw_questions[:num_questions]:
            try:
                if isinstance(item, dict):
                    item = {**item, "choices": self._normalize_choices(item.get("choices"))}
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

    @staticmethod
    def _normalize_choices(choices: Any) -> Any:
        if isinstance(choices, dict):
            return choices

        if isinstance(choices, list) and len(choices) >= 4:
            labels = ["A", "B", "C", "D"]
            normalized: dict[str, str] = {}
            for label, value in zip(labels, choices[:4]):
                text = str(value).strip()
                for prefix in (f"{label}.", f"{label})"):
                    if text.startswith(prefix):
                        text = text.removeprefix(prefix).strip()
                normalized[label] = text
            return normalized

        return choices
