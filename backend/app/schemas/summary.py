from pydantic import BaseModel


class SummaryResponse(BaseModel):
    session_id: str
    summary: str
    word_count: int
