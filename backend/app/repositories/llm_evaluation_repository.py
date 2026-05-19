"""Repository for persisting LLM evaluation records."""

from __future__ import annotations

from app.models.llm_evaluation import LLMEvaluation


class LLMEvaluationRepository:
    def __init__(self, db) -> None:
        self._db = db

    def get_by_session(self, session_id: str) -> LLMEvaluation | None:
        return self._db.query(LLMEvaluation).filter(LLMEvaluation.session_id == session_id).first()

    def upsert(
        self,
        session_id: str,
        summary_rating: int,
        quiz_rating: int,
        feedback: str | None,
        learning_outcome: float,
        llm_performance_score: float,
        performance_label: str,
    ) -> LLMEvaluation:
        existing = self.get_by_session(session_id)
        if existing:
            existing.summary_rating = summary_rating
            existing.quiz_rating = quiz_rating
            existing.feedback = feedback
            existing.learning_outcome = learning_outcome
            existing.llm_performance_score = llm_performance_score
            existing.performance_label = performance_label
            self._db.flush()
            return existing
        evaluation = LLMEvaluation(
            session_id=session_id,
            summary_rating=summary_rating,
            quiz_rating=quiz_rating,
            feedback=feedback,
            learning_outcome=learning_outcome,
            llm_performance_score=llm_performance_score,
            performance_label=performance_label,
        )
        self._db.add(evaluation)
        self._db.flush()
        return evaluation

    def get_all(self) -> list[LLMEvaluation]:
        return self._db.query(LLMEvaluation).all()
