from pydantic import BaseModel, Field


class QuizQuestionCreate(BaseModel):
    question: str
    choices: dict[str, str]
    correct_answer: str = Field(pattern="^[ABCD]$")
    explanation: str


class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    choices: dict[str, str]


class QuizResponse(BaseModel):
    session_id: str
    questions: list[QuizQuestionResponse]
    total: int
