from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_db
from app.models.summary import Summary
from app.schemas.summary import SummaryResponse


router = APIRouter(tags=["summary"])


@router.get("/summary/{session_id}", response_model=SummaryResponse)
def get_summary(session_id: str, db: DBSession = Depends(get_db)) -> SummaryResponse:
    summary = db.query(Summary).filter(Summary.session_id == session_id).first()
    if summary is None:
        raise HTTPException(status_code=404, detail="Summary not found")
    return SummaryResponse(
        session_id=session_id,
        summary=summary.summary_text,
        word_count=summary.word_count,
    )
