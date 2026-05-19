from fastapi import HTTPException
from sqlalchemy.orm import Session as DBSession

from app.repositories.llm_evaluation_repository import LLMEvaluationRepository
from app.repositories.quiz_repository import QuizResultRepository
from app.schemas.evaluation import EvaluationRequest, EvaluationResponse
from app.services.llm_evaluator import LLMEvaluator


class EvaluationService:
    def __init__(self, db: DBSession) -> None:
        self._db = db
        self._quiz_result_repo = QuizResultRepository(db)
        self._eval_repo = LLMEvaluationRepository(db)

    def evaluate_llm(self, session_id: str, payload: EvaluationRequest) -> EvaluationResponse:
        quiz_result = self._quiz_result_repo.get_latest_by_session(session_id)
        if quiz_result is None:
            raise HTTPException(status_code=400, detail="Submit quiz answers before evaluating the LLM")

        result = LLMEvaluator().evaluate(
            payload.summary_rating,
            payload.quiz_rating,
            quiz_result.correct_answers,
            quiz_result.total_questions,
        )

        self._eval_repo.upsert(
            session_id=session_id,
            summary_rating=payload.summary_rating,
            quiz_rating=payload.quiz_rating,
            feedback=payload.feedback,
            learning_outcome=float(result["learning_outcome"]),
            llm_performance_score=float(result["llm_performance_score"]),
            performance_label=str(result["performance_label"]),
        )
        self._db.commit()

        return EvaluationResponse(session_id=session_id, **result)
