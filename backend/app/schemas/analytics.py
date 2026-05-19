from pydantic import BaseModel


class AnalyticsOverviewResponse(BaseModel):
    total_sessions: int
    average_summary_rating: float
    average_quiz_rating: float
    average_quiz_score: float
    average_llm_performance_score: float
    label_distribution: dict[str, int]


class MLModelRunResponse(BaseModel):
    id: int
    model_type: str
    target_name: str
    accuracy: float | None
    precision_score: float | None
    recall_score: float | None
    f1_score: float | None
