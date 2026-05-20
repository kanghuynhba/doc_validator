"""Async quiz generator."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from app.config import get_settings
from app.schemas.quiz import QuizQuestionCreate
from app.services.prompt_loader import load_prompt

if TYPE_CHECKING:
    from app.services.lite_llm_client import LiteLLMClient


class QuizGenerator:
    """Async quiz generator.  Set the client via set_llm_client()."""

    def __init__(self, llm_client: "LiteLLMClient | None" = None) -> None:
        self._llm_client = llm_client
        self._settings = get_settings()
        self._prompt_template = load_prompt("quiz_generator.txt")

    def set_llm_client(self, client: "LiteLLMClient") -> None:
        self._llm_client = client

    async def generate_quiz_async(
        self, content: str, num_questions: int = 10, session_id: int | None = None
    ) -> list[QuizQuestionCreate]:
        if self._llm_client is None:
            raise RuntimeError("LLM client not set on QuizGenerator")

        prompt = self._prompt_template.format(num_questions=num_questions, content=content)
        raw_questions = await self._llm_client.complete_json(
            prompt, max_tokens=self._settings.quiz_max_tokens, chunk_index=None
        )

        if not isinstance(raw_questions, list):
            raw_questions = []

        validated = []
        for item in raw_questions[:num_questions]:
            try:
                if isinstance(item, dict):
                    item = {**item, "choices": self._normalize_choices(item.get("choices"))}
                validated.append(QuizQuestionCreate.model_validate(item))
            except Exception:
                continue

        return validated

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
