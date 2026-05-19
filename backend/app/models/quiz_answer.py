from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    quiz_result_id: Mapped[int] = mapped_column(ForeignKey("quiz_results.id"), index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), index=True)
    user_answer: Mapped[str] = mapped_column(String(1), nullable=False)
    correct_answer: Mapped[str] = mapped_column(String(1), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)

    quiz_result: Mapped["QuizResult"] = relationship(back_populates="answers")
    question: Mapped["Question"] = relationship(back_populates="quiz_answers")
