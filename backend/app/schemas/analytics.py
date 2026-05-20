from pydantic import BaseModel


class AnalyticsOverviewResponse(BaseModel):
    total_sessions: int
    average_summary_rating: float
    average_quiz_rating: float
    average_quiz_score: float
    average_llm_performance_score: float
    label_distribution: dict[str, int]


class LinearRegressionPoint(BaseModel):
    session_id: str
    file_name: str
    predicted_score: float
    actual_score: float


class LinearRegressionLinePoint(BaseModel):
    predicted_score: float
    ideal_score: float


class LinearRegressionAnalysisResponse(BaseModel):
    sample_count: int
    r2_score: float | None
    points: list[LinearRegressionPoint]
    line: list[LinearRegressionLinePoint]


class MLModelRunResponse(BaseModel):
    id: int
    model_type: str
    target_name: str
    accuracy: float | None
    precision_score: float | None
    recall_score: float | None
    f1_score: float | None
