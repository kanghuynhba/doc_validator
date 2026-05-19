from io import BytesIO
import re

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader

from app.config import get_settings


class PDFProcessor:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def validate_pdf(self, file: UploadFile) -> bytes:
        filename = file.filename or ""
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        if file.content_type not in {"application/pdf", "application/x-pdf"}:
            raise HTTPException(status_code=400, detail="Uploaded file must be a PDF")

        content = await file.read()
        max_bytes = self.settings.max_upload_mb * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(status_code=413, detail=f"PDF must be <= {self.settings.max_upload_mb} MB")
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded PDF is empty")
        return content

    async def extract_text(self, file: UploadFile) -> str:
        content = await self.validate_pdf(file)
        try:
            reader = PdfReader(BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Unable to read PDF") from exc
        if not text:
            raise HTTPException(status_code=400, detail="PDF does not contain extractable text")
        return self._normalize_text(text)

    def _normalize_text(self, text: str) -> str:
        text = re.sub(r"\f", "\n", text)
        text = re.sub(r"-\s*\n\s*(\w)", r"\1", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()
