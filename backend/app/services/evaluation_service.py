from fastapi import HTTPException
from sqlalchemy.orm import Session as DBSession

from app.models.llm_evaluation import LLMEvaluation
from app.models.quiz_result import QuizResult
from app.schemas.evaluation import EvaluationRequest, EvaluationResponse
from app.services.llm_evaluator import LLMEvaluator


class EvaluationService:
    def __init__(self, db: DBSession) -> None:
        self.db = db

    def evaluate_llm(self, session_id: str, payload: EvaluationRequest) -> EvaluationResponse:
        quiz_result = (
            self.db.query(QuizResult)
            .filter(QuizResult.session_id == session_id)
            .order_by(QuizResult.created_at.desc())
            .first()
        )
        if quiz_result is None:
            raise HTTPException(status_code=400, detail="Submit quiz answers before evaluating the LLM")

        result = LLMEvaluator().evaluate(
            payload.summary_rating,
            payload.quiz_rating,
            quiz_result.correct_answers,
            quiz_result.total_questions,
        )
        existing = self.db.query(LLMEvaluation).filter(LLMEvaluation.session_id == session_id).first()
        if existing is None:
            existing = LLMEvaluation(session_id=session_id)
            self.db.add(existing)

        existing.summary_rating = payload.summary_rating
        existing.quiz_rating = payload.quiz_rating
        existing.feedback = payload.feedback
        existing.learning_outcome = float(result["learning_outcome"])
        existing.llm_performance_score = float(result["llm_performance_score"])
        existing.performance_label = str(result["performance_label"])
        self.db.commit()

        return EvaluationResponse(session_id=session_id, **result)
