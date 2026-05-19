from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from app.models.session import Session
from app.repositories.llm_evaluation_repository import LLMEvaluationRepository
from app.repositories.quiz_repository import QuizResultRepository
from app.schemas.analytics import AnalyticsOverviewResponse


class AnalyticsService:
    def __init__(self, db: DBSession) -> None:
        self._db = db
        self._eval_repo = LLMEvaluationRepository(db)
        self._quiz_result_repo = QuizResultRepository(db)

    def overview(self) -> AnalyticsOverviewResponse:
        total_sessions = self._db.query(func.count(Session.id)).scalar() or 0
        evals = self._eval_repo.get_all()

        avg_summary_rating = 0.0
        avg_quiz_rating = 0.0
        avg_llm_score = 0.0
        if evals:
            avg_summary_rating = sum(e.summary_rating for e in evals) / len(evals)
            avg_quiz_rating = sum(e.quiz_rating for e in evals) / len(evals)
            avg_llm_score = sum(e.llm_performance_score for e in evals) / len(evals)

        quiz_results = self._db.query(QuizResult).all()
        avg_quiz_score = sum(qr.score for qr in quiz_results) / len(quiz_results) if quiz_results else 0.0

        distribution = {"Excellent": 0, "Good": 0, "Average": 0, "Poor": 0}
        for e in evals:
            distribution[e.performance_label] = distribution.get(e.performance_label, 0) + 1

        return AnalyticsOverviewResponse(
            total_sessions=total_sessions,
            average_summary_rating=round(avg_summary_rating, 2),
            average_quiz_rating=round(avg_quiz_rating, 2),
            average_quiz_score=round(avg_quiz_score, 2),
            average_llm_performance_score=round(avg_llm_score, 2),
            label_distribution=distribution,
        )


# Workaround for circular import inside overview()
from app.models.quiz_result import QuizResult
