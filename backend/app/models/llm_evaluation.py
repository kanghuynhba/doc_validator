from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LLMEvaluation(Base):
    __tablename__ = "llm_evaluations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), unique=True, index=True)
    summary_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    quiz_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    feedback: Mapped[str | None] = mapped_column(Text)
    learning_outcome: Mapped[float] = mapped_column(Float, nullable=False)
    llm_performance_score: Mapped[float] = mapped_column(Float, nullable=False)
    performance_label: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["Session"] = relationship(back_populates="evaluation")
