from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models.session import Session


router = APIRouter(tags=["history"])


class HistoryEntryResponse(BaseModel):
    session_id: str
    file_name: str
    created_at: datetime
    status: str
    num_questions: int
    summary_rating: float | None = None
    quiz_rating: float | None = None
    quiz_score: float | None = None
    llm_performance_score: float | None = None


@router.get("/history", response_model=list[HistoryEntryResponse])
def get_history(db: DBSession = Depends(get_db)) -> list[HistoryEntryResponse]:
    sessions = (
        db.query(Session)
        .order_by(Session.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        HistoryEntryResponse(
            session_id=session.id,
            file_name=session.filename,
            created_at=session.created_at,
            status=session.status,
            num_questions=len(session.questions),
            summary_rating=session.evaluation.summary_rating if session.evaluation else None,
            quiz_rating=session.evaluation.quiz_rating if session.evaluation else None,
            quiz_score=session.evaluation.learning_outcome if session.evaluation else None,
            llm_performance_score=(
                session.evaluation.llm_performance_score if session.evaluation else None
            ),
        )
        for session in sessions
    ]


@router.delete("/history/{session_id}", status_code=204)
def delete_history_entry(session_id: str, db: DBSession = Depends(get_db)) -> None:
    session = db.query(Session).filter(Session.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(session)
    db.commit()
