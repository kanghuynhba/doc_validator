from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_db
from app.schemas.grading import GradeRequest, GradeResponse
from app.services.grader import Grader


router = APIRouter(tags=["grading"])


@router.post("/grade/{session_id}", response_model=GradeResponse)
def grade_quiz(session_id: str, payload: GradeRequest, db: DBSession = Depends(get_db)) -> GradeResponse:
    return Grader(db).grade(session_id, payload.answers)
