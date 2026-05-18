from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_db
from app.models.question import Question
from app.schemas.quiz import QuizQuestionResponse, QuizResponse


router = APIRouter(tags=["quiz"])


@router.get("/quiz/{session_id}", response_model=QuizResponse)
def get_quiz(session_id: str, db: DBSession = Depends(get_db)) -> QuizResponse:
    questions = db.query(Question).filter(Question.session_id == session_id).all()
    if not questions:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return QuizResponse(
        session_id=session_id,
        questions=[
            QuizQuestionResponse(
                id=question.id,
                question=question.question_text,
                choices={
                    "A": question.choice_a,
                    "B": question.choice_b,
                    "C": question.choice_c,
                    "D": question.choice_d,
                },
            )
            for question in questions
        ],
        total=len(questions),
    )
