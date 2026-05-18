from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from app.models.llm_evaluation import LLMEvaluation
from app.models.quiz_result import QuizResult
from app.models.session import Session
from app.schemas.analytics import AnalyticsOverviewResponse


class AnalyticsService:
    def __init__(self, db: DBSession) -> None:
        self.db = db

    def overview(self) -> AnalyticsOverviewResponse:
        total_sessions = self.db.query(func.count(Session.id)).scalar() or 0
        avg_summary_rating = self.db.query(func.avg(LLMEvaluation.summary_rating)).scalar() or 0
        avg_quiz_rating = self.db.query(func.avg(LLMEvaluation.quiz_rating)).scalar() or 0
        avg_quiz_score = self.db.query(func.avg(QuizResult.score)).scalar() or 0
        avg_llm_score = self.db.query(func.avg(LLMEvaluation.llm_performance_score)).scalar() or 0

        rows = (
            self.db.query(LLMEvaluation.performance_label, func.count(LLMEvaluation.id))
            .group_by(LLMEvaluation.performance_label)
            .all()
        )
        distribution = {"Excellent": 0, "Good": 0, "Average": 0, "Poor": 0}
        distribution.update({label: count for label, count in rows})

        return AnalyticsOverviewResponse(
            total_sessions=total_sessions,
            average_summary_rating=round(float(avg_summary_rating), 2),
            average_quiz_rating=round(float(avg_quiz_rating), 2),
            average_quiz_score=round(float(avg_quiz_score), 2),
            average_llm_performance_score=round(float(avg_llm_score), 2),
            label_distribution=distribution,
        )
