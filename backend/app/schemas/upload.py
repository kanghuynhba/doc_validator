from pydantic import BaseModel


class UploadResponse(BaseModel):
    session_id: str
    filename: str
    num_chunks: int
    status: str
