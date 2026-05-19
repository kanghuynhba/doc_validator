"""Repository for quiz results and individual answer records."""

from __future__ import annotations

from app.models.quiz_answer import QuizAnswer
from app.models.quiz_result import QuizResult


class QuizResultRepository:
    def __init__(self, db) -> None:
        self._db = db

    def get_latest_by_session(self, session_id: str) -> QuizResult | None:
        return (
            self._db.query(QuizResult)
            .filter(QuizResult.session_id == session_id)
            .order_by(QuizResult.created_at.desc())
            .first()
        )

    def create(self, session_id: str, score: float, correct_answers: int, total_questions: int) -> QuizResult:
        result = QuizResult(
            session_id=session_id,
            score=score,
            correct_answers=correct_answers,
            total_questions=total_questions,
        )
        self._db.add(result)
        self._db.flush()
        return result

    def get_by_session(self, session_id: str) -> list[QuizResult]:
        return self._db.query(QuizResult).filter(QuizResult.session_id == session_id).all()


class QuizAnswerRepository:
    def __init__(self, db) -> None:
        self._db = db

    def bulk_create(self, quiz_result_id: int, answers: list[dict]) -> list[QuizAnswer]:
        models = [
            QuizAnswer(
                quiz_result_id=quiz_result_id,
                question_id=a["question_id"],
                user_answer=a["user_answer"],
                correct_answer=a["correct_answer"],
                is_correct=a["is_correct"],
            )
            for a in answers
        ]
        self._db.add_all(models)
        self._db.flush()
        return models
