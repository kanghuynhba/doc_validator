from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_db
from app.schemas.upload import UploadResponse
from app.services.document_pipeline import DocumentPipelineService


router = APIRouter(tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    num_questions: int = Form(10),
    db: DBSession = Depends(get_db),
) -> UploadResponse:
    return await DocumentPipelineService(db).process_pdf(file, num_questions=num_questions)
