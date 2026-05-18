from pydantic import BaseModel, Field


class GradeRequest(BaseModel):
    answers: dict[int, str] = Field(default_factory=dict)


class GradeItemResponse(BaseModel):
    question_id: int
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str


class GradeResponse(BaseModel):
    score: float
    correct: int
    total: int
    results: list[GradeItemResponse]
