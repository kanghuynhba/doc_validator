from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_db
from app.models.llm_call import LLMCall
from app.models.llm_evaluation import LLMEvaluation
from app.models.question import Question
from app.models.quiz_answer import QuizAnswer
from app.models.quiz_result import QuizResult
from app.models.session import Session
from app.models.summary import Summary


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

    quiz_result_ids = [
        row[0]
        for row in db.query(QuizResult.id)
        .filter(QuizResult.session_id == session_id)
        .all()
    ]
    question_ids = [
        row[0]
        for row in db.query(Question.id)
        .filter(Question.session_id == session_id)
        .all()
    ]

    if quiz_result_ids:
        db.query(QuizAnswer).filter(
            QuizAnswer.quiz_result_id.in_(quiz_result_ids)
        ).delete(synchronize_session=False)
    if question_ids:
        db.query(QuizAnswer).filter(
            QuizAnswer.question_id.in_(question_ids)
        ).delete(synchronize_session=False)

    db.query(QuizResult).filter(QuizResult.session_id == session_id).delete(
        synchronize_session=False
    )
    db.query(Question).filter(Question.session_id == session_id).delete(
        synchronize_session=False
    )
    db.query(Summary).filter(Summary.session_id == session_id).delete(
        synchronize_session=False
    )
    db.query(LLMEvaluation).filter(LLMEvaluation.session_id == session_id).delete(
        synchronize_session=False
    )
    db.query(LLMCall).filter(LLMCall.session_id == session_id).delete(
        synchronize_session=False
    )
    db.delete(session)
    db.commit()
