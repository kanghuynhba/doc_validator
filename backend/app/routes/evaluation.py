from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_db
from app.schemas.evaluation import EvaluationRequest, EvaluationResponse
from app.services.evaluation_service import EvaluationService


router = APIRouter(tags=["evaluation"])


@router.post("/evaluate-llm/{session_id}", response_model=EvaluationResponse)
def evaluate_llm(session_id: str, payload: EvaluationRequest, db: DBSession = Depends(get_db)) -> EvaluationResponse:
    return EvaluationService(db).evaluate_llm(session_id, payload)
