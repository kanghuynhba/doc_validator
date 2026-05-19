from datetime import datetime

from sqlalchemy import DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MLModelRun(Base):
    __tablename__ = "ml_model_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    model_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_name: Mapped[str] = mapped_column(String(100), nullable=False)
    accuracy: Mapped[float | None] = mapped_column(Float)
    precision_score: Mapped[float | None] = mapped_column(Float)
    recall_score: Mapped[float | None] = mapped_column(Float)
    f1_score: Mapped[float | None] = mapped_column(Float)
    trained_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
