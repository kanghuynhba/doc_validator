from dataclasses import dataclass

from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score


@dataclass
class ClassificationMetrics:
    accuracy: float
    precision_score: float
    recall_score: float
    f1_score: float


class MetricsCalculator:
    def classification(self, y_true: list[int], y_pred: list[int]) -> ClassificationMetrics:
        return ClassificationMetrics(
            accuracy=round(float(accuracy_score(y_true, y_pred)), 4),
            precision_score=round(float(precision_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
            recall_score=round(float(recall_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
            f1_score=round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        )
