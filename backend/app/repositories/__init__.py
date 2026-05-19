"""Repository layer for database models.

Each repository exposes a clean, testable interface for the services layer
and is instantiated with a SQLAlchemy session.
"""

from __future__ import annotations

from app.models.question import Question
from app.models.session import Session
from app.models.summary import Summary
from app.repositories.llm_call_repository import LLMCallRepository
from app.repositories.llm_evaluation_repository import LLMEvaluationRepository
from app.repositories.ml_model_run_repository import MLModelRunRepository
from app.repositories.quiz_repository import QuizAnswerRepository, QuizResultRepository


class SessionRepository:
    def __init__(self, db) -> None:
        self._db = db

    def create(self, filename: str, document_length: int, num_chunks: int) -> Session:
        session = Session(
            filename=filename,
            document_length=document_length,
            num_chunks=num_chunks,
            status="processing",
        )
        self._db.add(session)
        self._db.flush()
        return session

    def get(self, session_id: int) -> Session | None:
        return self._db.query(Session).filter(Session.id == session_id).first()

    def update_status(self, session_id: int, status: str) -> None:
        self._db.query(Session).filter(Session.id == session_id).update({"status": status})
        self._db.flush()


class SummaryRepository:
    def __init__(self, db) -> None:
        self._db = db

    def create(self, session_id: int, summary_text: str, word_count: int) -> Summary:
        summary = Summary(session_id=session_id, summary_text=summary_text, word_count=word_count)
        self._db.add(summary)
        self._db.flush()
        return summary

    def get_by_session(self, session_id: int) -> Summary | None:
        return self._db.query(Summary).filter(Summary.session_id == session_id).first()

    def upsert(self, session_id: int, summary_text: str, word_count: int) -> Summary:
        existing = self.get_by_session(session_id)
        if existing:
            existing.summary_text = summary_text
            existing.word_count = word_count
            self._db.flush()
            return existing
        return self.create(session_id, summary_text, word_count)


class QuestionRepository:
    def __init__(self, db) -> None:
        self._db = db

    def create(self, session_id: int, question_text: str, choice_a: str, choice_b: str, choice_c: str, choice_d: str, correct_answer: str, explanation: str) -> Question:
        question = Question(
            session_id=session_id,
            question_text=question_text,
            choice_a=choice_a,
            choice_b=choice_b,
            choice_c=choice_c,
            choice_d=choice_d,
            correct_answer=correct_answer,
            explanation=explanation,
        )
        self._db.add(question)
        self._db.flush()
        return question

    def bulk_create(self, session_id: int, questions: list[dict]) -> list[Question]:
        models = [
            Question(session_id=session_id, **q)
            for q in questions
        ]
        self._db.add_all(models)
        self._db.flush()
        return models

    def get_by_session(self, session_id: int) -> list[Question]:
        return self._db.query(Question).filter(Question.session_id == session_id).all()
