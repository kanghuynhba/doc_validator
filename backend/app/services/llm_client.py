import json
from typing import Any

from app.config import get_settings


class LLMClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None
        if self.settings.openai_api_key:
            from openai import OpenAI

            self._client = OpenAI(api_key=self.settings.openai_api_key)

    def complete(self, prompt: str, max_tokens: int = 1200) -> str:
        if self._client is None:
            return self._fallback_text(prompt)
        response = self._client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=self.settings.llm_temperature,
            max_tokens=max_tokens,
            timeout=60,
        )
        return response.choices[0].message.content or ""

    def complete_json(self, prompt: str) -> Any:
        if self._client is None:
            return self._fallback_quiz(prompt)
        response_text = self.complete(prompt, max_tokens=2000)
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            start = response_text.find("[")
            end = response_text.rfind("]")
            if start != -1 and end != -1 and end > start:
                return json.loads(response_text[start : end + 1])
            raise

    def _fallback_text(self, prompt: str) -> str:
        source = prompt.split("CONTENT:", 1)[-1].strip() if "CONTENT:" in prompt else prompt
        words = source.split()
        summary = " ".join(words[:180])
        return summary or "No summary could be generated."

    def _fallback_quiz(self, prompt: str) -> list[dict[str, Any]]:
        content = prompt.split("CONTENT:", 1)[-1].strip()
        snippets = [sentence.strip() for sentence in content.replace("\n", " ").split(".") if sentence.strip()]
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
