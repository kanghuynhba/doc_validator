from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session as DBSession

from app.config import get_settings
from app.models.question import Question
from app.models.session import Session
from app.models.summary import Summary
from app.schemas.upload import UploadResponse
from app.services.pdf_processor import PDFProcessor
from app.services.quiz_generator import QuizGenerator
from app.services.quiz_validator import QuizValidator
from app.services.summarizer import Summarizer
from app.services.text_chunker import TextChunker


class DocumentPipelineService:
    def __init__(self, db: DBSession) -> None:
        self.db = db
        self.settings = get_settings()
        self.pdf_processor = PDFProcessor()
        self.text_chunker = TextChunker()
        self.summarizer = Summarizer()
        self.quiz_generator = QuizGenerator()
        self.quiz_validator = QuizValidator()

    async def process_pdf(self, file: UploadFile, num_questions: int = 10) -> UploadResponse:
        text = await self.pdf_processor.extract_text(file)
        chunks = self.text_chunker.chunk_text(
            text,
            chunk_size=self.settings.chunk_size,
            overlap=self.settings.chunk_overlap,
        )
        if not chunks:
            raise HTTPException(status_code=400, detail="No text chunks could be created")

        session = Session(
            filename=file.filename or "uploaded.pdf",
            document_length=len(text),
            num_chunks=len(chunks),
            status="processing",
        )
        self.db.add(session)
        self.db.flush()

        try:
            final_summary = self.summarizer.summarize_document(
                text,
                chunk_size=self.settings.chunk_size,
                overlap=self.settings.chunk_overlap,
            )
            self.db.add(
                Summary(
                    session_id=session.id,
                    summary_text=final_summary,
                    word_count=len(final_summary.split()),
                )
            )

            generated_questions = self.quiz_generator.generate_quiz(final_summary or text[:4000], num_questions)
            valid_questions = self.quiz_validator.validate(generated_questions)
            for item in valid_questions:
                self.db.add(
                    Question(
                        session_id=session.id,
                        question_text=item.question,
                        choice_a=item.choices["A"],
                        choice_b=item.choices["B"],
                        choice_c=item.choices["C"],
                        choice_d=item.choices["D"],
                        correct_answer=item.correct_answer,
                        explanation=item.explanation,
                    )
                )
            session.status = "ready"
            self.db.commit()
        except Exception:
            self.db.rollback()
            session.status = "failed"
            self.db.add(session)
            self.db.commit()
            raise

        return UploadResponse(
            session_id=session.id,
            filename=session.filename,
            num_chunks=session.num_chunks,
            status=session.status,
            summary=final_summary,
            word_count=len(final_summary.split()),
        )
