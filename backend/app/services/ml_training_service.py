from fastapi import HTTPException
from sqlalchemy.orm import Session as DBSession

from app.ml.linear_regression import LinearRegressionTrainer
from app.ml.logistic_regression import LogisticRegressionTrainer
from app.models.llm_evaluation import LLMEvaluation
from app.models.ml_model_run import MLModelRun
from app.schemas.analytics import MLModelRunResponse


label_to_int = {"Poor": 0, "Average": 1, "Good": 2, "Excellent": 3}


class MLTrainingService:
    def __init__(self, db: DBSession) -> None:
        self.db = db

    def train_linear(self) -> MLModelRunResponse:
        rows = self.db.query(LLMEvaluation).all()
        if len(rows) < 2:
            raise HTTPException(status_code=400, detail="At least two evaluations are required to train")
        features = [[row.summary_rating, row.quiz_rating, row.learning_outcome] for row in rows]
        targets = [row.llm_performance_score for row in rows]
        r2_score = LinearRegressionTrainer().train(features, targets)
        return self._save_run("linear_regression", "llm_performance_score", accuracy=r2_score)

    def train_logistic(self) -> MLModelRunResponse:
        rows = self.db.query(LLMEvaluation).all()
        classes = {row.performance_label for row in rows}
        if len(rows) < 3 or len(classes) < 2:
            raise HTTPException(status_code=400, detail="At least three evaluations across two labels are required to train")
        features = [[row.summary_rating, row.quiz_rating, row.learning_outcome] for row in rows]
        targets = [label_to_int[row.performance_label] for row in rows]
        metrics = LogisticRegressionTrainer().train(features, targets)
        return self._save_run(
            "logistic_regression",
            "performance_label",
            accuracy=metrics.accuracy,
            precision_score=metrics.precision_score,
            recall_score=metrics.recall_score,
            f1_score=metrics.f1_score,
        )

    def _save_run(
        self,
        model_type: str,
        target_name: str,
        accuracy: float | None = None,
        precision_score: float | None = None,
        recall_score: float | None = None,
        f1_score: float | None = None,
    ) -> MLModelRunResponse:
        run = MLModelRun(
            model_type=model_type,
            target_name=target_name,
            accuracy=accuracy,
            precision_score=precision_score,
            recall_score=recall_score,
            f1_score=f1_score,
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return MLModelRunResponse(
            id=run.id,
            model_type=run.model_type,
            target_name=run.target_name,
            accuracy=run.accuracy,
            precision_score=run.precision_score,
            recall_score=run.recall_score,
            f1_score=run.f1_score,
        )
