from fastapi import HTTPException

from app.schemas.quiz import QuizQuestionCreate


class QuizValidator:
    valid_choices = {"A", "B", "C", "D"}

    def validate(self, questions: list[QuizQuestionCreate]) -> list[QuizQuestionCreate]:
        valid: list[QuizQuestionCreate] = []
        seen: set[str] = set()
        for question in questions:
            normalized = question.question.strip().lower()
            if not normalized or normalized in seen:
                continue
            if set(question.choices.keys()) != self.valid_choices:
                continue
            if question.correct_answer not in self.valid_choices:
                continue
            if not all(str(value).strip() for value in question.choices.values()):
                continue
            if not question.explanation.strip():
                continue
            seen.add(normalized)
            valid.append(question)

        if not valid:
            raise HTTPException(status_code=502, detail="LLM did not produce valid quiz questions")
        return valid
