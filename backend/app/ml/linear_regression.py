from sklearn.linear_model import LinearRegression


class LinearRegressionTrainer:
    def fit(self, features: list[list[float]], targets: list[float]) -> LinearRegression:
        model = LinearRegression()
        model.fit(features, targets)
        return model

    def train(self, features: list[list[float]], targets: list[float]) -> float:
        model = self.fit(features, targets)
        return round(float(model.score(features, targets)), 4)
