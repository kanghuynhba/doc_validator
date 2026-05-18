from sklearn.linear_model import LinearRegression


class LinearRegressionTrainer:
    def train(self, features: list[list[float]], targets: list[float]) -> float:
        model = LinearRegression()
        model.fit(features, targets)
        return round(float(model.score(features, targets)), 4)
