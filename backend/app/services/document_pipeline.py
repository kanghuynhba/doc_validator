"""Main async pipeline service coordinating PDF processing, summarisation and quiz generation."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session as DBSession

from app.config import get_settings
from app.logging_config import get_logger
from app.repositories import QuestionRepository, SessionRepository, SummaryRepository
from app.schemas.upload import UploadResponse
from app.services.pdf_processor import PDFProcessor
from app.services.quiz_validator import QuizValidator

if TYPE_CHECKING:
    from app.services.lite_llm_client import LiteLLMClient


class DocumentPipelineService:
    """Async document processing pipeline."""

    def __init__(self, db: DBSession, llm_client: "LiteLLMClient | None" = None) -> None:
        self._db = db
        self._settings = get_settings()
        self._log = get_logger(__name__)

        self._pdf_processor = PDFProcessor()
        self._summarizer = None
        self._quiz_generator = None
        self._quiz_validator = QuizValidator()

        self._session_repo = SessionRepository(db)
        self._summary_repo = SummaryRepository(db)
        self._question_repo = QuestionRepository(db)

        if llm_client is not None:
            self.set_llm_client(llm_client)

    def set_llm_client(self, client: "LiteLLMClient") -> None:
        self._summarizer = self._build_summarizer(client)
        self._quiz_generator = self._build_quiz_generator(client)

    def _build_summarizer(self, client: "LiteLLMClient"):
        from app.services.summarizer import Summarizer

        s = Summarizer(
            chunk_size=self._settings.chunk_size,
            overlap=self._settings.chunk_overlap,
            direct_summary_char_limit=self._settings.direct_summary_char_limit,
            max_concurrency=self._settings.max_llm_concurrency,
            summary_max_tokens=self._settings.summary_max_tokens,
            reduce_max_tokens=self._settings.reduce_max_tokens,
        )
        s.set_llm_client(client)
        return s

    def _build_quiz_generator(self, client: "LiteLLMClient"):
        from app.services.quiz_generator import QuizGenerator

        return QuizGenerator(llm_client=client)

    async def process_pdf(self, file: UploadFile, num_questions: int = 10) -> UploadResponse:
        text = await self._pdf_processor.extract_text(file)

        if not text.strip():
            raise HTTPException(status_code=400, detail="No readable text found in PDF")

        chunks = (
            [text]
            if self._summarizer and self._summarizer.should_summarize_directly(text)
            else self._summarizer.chunk_document(text) if self._summarizer else []
        )
        if not chunks:
            raise HTTPException(status_code=400, detail="No text chunks could be created")

        self._log.info("Document chunks: %d", len(chunks))

        session = self._session_repo.create(
            filename=file.filename or "uploaded.pdf",
            document_length=len(text),
            num_chunks=len(chunks),
        )

        try:
            final_summary = (
                await self._summarizer.summarize_direct(text, session_id=session.id)
                if self._summarizer.should_summarize_directly(text)
                else await self._summarizer.summarize_chunks(chunks, session_id=session.id)
            )

            self._summary_repo.upsert(
                session_id=session.id,
                summary_text=final_summary,
                word_count=len(final_summary.split()),
            )

            generated_questions = await self._quiz_generator.generate_quiz_async(
                final_summary or text[:4000], num_questions, session_id=session.id
            )
            valid_questions = self._quiz_validator.validate(generated_questions)

            question_dicts = [
                {
                    "question_text": item.question,
                    "choice_a": item.choices["A"],
                    "choice_b": item.choices["B"],
                    "choice_c": item.choices["C"],
                    "choice_d": item.choices["D"],
                    "correct_answer": item.correct_answer,
                    "explanation": item.explanation,
                }
                for item in valid_questions
            ]
            self._question_repo.bulk_create(session.id, question_dicts)

            self._session_repo.update_status(session.id, "ready")
            self._db.commit()

            return UploadResponse(
                session_id=session.id,
                filename=session.filename,
                num_chunks=session.num_chunks,
                status="ready",
                summary=final_summary,
                word_count=len(final_summary.split()),
            )

        except Exception as exc:
            self._db.rollback()
            self._session_repo.update_status(session.id, "failed")
            self._db.commit()
            self._log.error("Pipeline failed for session %s: %s", session.id, exc, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Processing failed: {exc}") from exc
