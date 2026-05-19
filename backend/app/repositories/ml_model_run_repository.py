"""Repository for persisting ML model training runs."""

from __future__ import annotations

from app.models.ml_model_run import MLModelRun


class MLModelRunRepository:
    def __init__(self, db) -> None:
        self._db = db

    def create(
        self,
        model_type: str,
        target_name: str,
        accuracy: float | None = None,
        precision_score: float | None = None,
        recall_score: float | None = None,
        f1_score: float | None = None,
    ) -> MLModelRun:
        run = MLModelRun(
            model_type=model_type,
            target_name=target_name,
            accuracy=accuracy,
            precision_score=precision_score,
            recall_score=recall_score,
            f1_score=f1_score,
        )
        self._db.add(run)
        self._db.flush()
        return run

    def get_all(self) -> list[MLModelRun]:
        return self._db.query(MLModelRun).all()

    def get_latest(self, model_type: str | None = None) -> MLModelRun | None:
        q = self._db.query(MLModelRun)
        if model_type:
            q = q.filter(MLModelRun.model_type == model_type)
        return q.order_by(MLModelRun.trained_at.desc()).first()
