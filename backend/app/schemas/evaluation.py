from pydantic import BaseModel, Field


class EvaluationRequest(BaseModel):
    summary_rating: int = Field(ge=1, le=5)
    quiz_rating: int = Field(ge=1, le=5)
    feedback: str | None = None


class EvaluationResponse(BaseModel):
    session_id: str
    summary_satisfaction: float
    quiz_satisfaction: float
    learning_outcome: float
    llm_performance_score: float
    performance_label: str
