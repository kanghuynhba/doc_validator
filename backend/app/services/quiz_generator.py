from app.schemas.quiz import QuizQuestionCreate
from app.services.llm_client import LLMClient


class QuizGenerator:
    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client or LLMClient()

    def generate_quiz(self, content: str, num_questions: int = 10) -> list[QuizQuestionCreate]:
        prompt = (
            f"Create {num_questions} multiple-choice questions from the content. "
            "Return only strict JSON array items with keys question, choices, correct_answer, explanation. "
            "choices must contain A, B, C, D. correct_answer must be A, B, C, or D.\n\nCONTENT:\n"
            f"{content}"
        )
        raw_questions = self.llm_client.complete_json(prompt)
        return [QuizQuestionCreate.model_validate(item) for item in raw_questions[:num_questions]]
