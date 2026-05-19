"""Main async pipeline service coordinating PDF processing, summarisation and quiz generation."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session as DBSession

from app.config import get_settings
from app.logging_config import get_logger, log_pipeline_stage
from app.models.question import Question
from app.models.session import Session
from app.models.summary import Summary
from app.repositories import QuestionRepository, SessionRepository, SummaryRepository
from app.repositories.llm_call_repository import LLMCallRepository
from app.schemas.upload import UploadResponse
from app.services.pdf_processor import PDFProcessor
from app.services.quiz_generator import QuizGenerator
from app.services.quiz_validator import QuizValidator

if TYPE_CHECKING:
    from app.services.llm_client import AsyncLLMClient


class DocumentPipelineService:
    """Async document processing pipeline with full logging and repository access."""

    def __init__(self, db: DBSession, llm_client: "AsyncLLMClient | None" = None) -> None:
        self._db = db
        self._settings = get_settings()
        self._log = get_logger(__name__)

        self._pdf_processor = PDFProcessor()
        self._summarizer = None  # injected via set_llm_client
        self._quiz_generator = None  # injected via set_llm_client
        self._quiz_validator = QuizValidator()

        self._session_repo = SessionRepository(db)
        self._summary_repo = SummaryRepository(db)
        self._question_repo = QuestionRepository(db)
        self._llm_call_repo = LLMCallRepository(db)

        if llm_client is not None:
            self.set_llm_client(llm_client)

    def set_llm_client(self, client: "AsyncLLMClient") -> None:
        """Inject the shared async LLM client after construction (avoids circular imports)."""
        self._summarizer = self._build_summarizer(client)
        self._quiz_generator = self._build_quiz_generator(client)

    # ------------------------------------------------------------------ #
    # Internal factory helpers
    # ------------------------------------------------------------------ #
    def _build_summarizer(self, client: "AsyncLLMClient"):
        from app.services.summarizer import Summarizer
        s = Summarizer(
            chunk_size=self._settings.chunk_size,
            overlap=self._settings.chunk_overlap,
        )
        s.set_llm_client(client)
        return s

    def _build_quiz_generator(self, client: "AsyncLLMClient"):
        from app.services.quiz_generator import QuizGenerator
        return QuizGenerator(llm_client=client)

    # ------------------------------------------------------------------ #
    # Public pipeline
    # ------------------------------------------------------------------ #
    async def process_pdf(self, file: UploadFile, num_questions: int = 10) -> UploadResponse:
        log_pipeline_stage(self._log, "start", file_name=file.filename, num_questions=num_questions)

        text = await self._pdf_processor.extract_text(file)
        log_pipeline_stage(self._log, "pdf_extracted", file_name=file.filename, text_len=len(text))

        if not text.strip():
            raise HTTPException(status_code=400, detail="No readable text found in PDF")

        chunks = self._summarizer.chunk_document(text) if self._summarizer else []
        if not chunks:
            raise HTTPException(status_code=400, detail="No text chunks could be created")

        session = self._session_repo.create(
            filename=file.filename or "uploaded.pdf",
            document_length=len(text),
            num_chunks=len(chunks),
        )
        log_pipeline_stage(self._log, "session_created", session_id=session.id, num_chunks=len(chunks))

        try:
            # ── Async summarisation (parallel chunks) ──────────────────
            final_summary = await self._summarizer.summarize_document(text, session_id=session.id)

            self._summary_repo.upsert(
                session_id=session.id,
                summary_text=final_summary,
                word_count=len(final_summary.split()),
            )
            log_pipeline_stage(self._log, "summary_saved", session_id=session.id, summary_len=len(final_summary))

            # ── Async quiz generation ─────────────────────────────────
            log_pipeline_stage(self._log, "quiz_generation", session_id=session.id)
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
            log_pipeline_stage(self._log, "quiz_saved", session_id=session.id, num_questions=len(question_dicts))

            # ── Mark session ready ─────────────────────────────────────
            self._session_repo.update_status(session.id, "ready")
            self._db.commit()
            log_pipeline_stage(self._log, "done", session_id=session.id, status="ready")

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
            self._log.error("Pipeline failed for session %d: %s", session.id, exc, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Processing failed: {exc}") from exc
