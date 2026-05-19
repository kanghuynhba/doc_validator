from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    document_length: Mapped[int] = mapped_column(Integer, default=0)
    num_chunks: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), default="created")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    summary: Mapped["Summary | None"] = relationship(back_populates="session", uselist=False, cascade="all, delete-orphan")
    questions: Mapped[list["Question"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    quiz_results: Mapped[list["QuizResult"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    evaluation: Mapped["LLMEvaluation | None"] = relationship(back_populates="session", uselist=False, cascade="all, delete-orphan")
