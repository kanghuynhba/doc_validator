"""Upload endpoint with async LLM client lifecycle management."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_db
from app.schemas.upload import UploadResponse
from app.services.document_pipeline import DocumentPipelineService
from app.services.llm_client import AsyncLLMClient


# Singleton — created once per worker, reused across requests.
_llm_client: AsyncLLMClient | None = None


def get_llm_client() -> AsyncLLMClient:
    global _llm_client
    if _llm_client is None:
        _llm_client = AsyncLLMClient()
    return _llm_client


async def shutdown_llm_client() -> None:
    global _llm_client
    if _llm_client is not None:
        await _llm_client.close()
        _llm_client = None


router = APIRouter(tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    num_questions: int = Form(10),
    db: DBSession = Depends(get_db),
    llm_client: AsyncLLMClient = Depends(get_llm_client),
) -> UploadResponse:
    service = DocumentPipelineService(db, llm_client=llm_client)
    return await service.process_pdf(file, num_questions=num_questions)
