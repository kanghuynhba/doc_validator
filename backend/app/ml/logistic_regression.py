from sklearn.linear_model import LogisticRegression

from app.ml.metrics import ClassificationMetrics, MetricsCalculator


class LogisticRegressionTrainer:
    def train(self, features: list[list[float]], targets: list[int]) -> ClassificationMetrics:
        model = LogisticRegression(max_iter=1000)
        model.fit(features, targets)
        predictions = model.predict(features)
        return MetricsCalculator().classification(targets, predictions.tolist())
