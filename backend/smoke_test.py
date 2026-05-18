from app.database import SessionLocal, create_db_and_tables
from app.models.question import Question
from app.models.session import Session
from app.schemas.evaluation import EvaluationRequest
from app.services.analytics_service import AnalyticsService
from app.services.evaluation_service import EvaluationService
from app.services.grader import Grader


def main() -> None:
    create_db_and_tables()
    db = SessionLocal()
    try:
        session = Session(filename="smoke.pdf", document_length=1200, num_chunks=2, status="ready")
        db.add(session)
        db.flush()
        db.add(
            Question(
                session_id=session.id,
                question_text="What is the pipeline root entity?",
                choice_a="Session",
                choice_b="Theme",
                choice_c="Asset",
                choice_d="Page",
                correct_answer="A",
                explanation="A session represents one PDF processing attempt.",
            )
        )
        db.commit()

        question = db.query(Question).filter(Question.session_id == session.id).first()
        grade = Grader(db).grade(session.id, {question.id: "A"})
        evaluation = EvaluationService(db).evaluate_llm(
            session.id,
            EvaluationRequest(summary_rating=4, quiz_rating=5, feedback="Smoke test"),
        )
        overview = AnalyticsService(db).overview()
        print(
            {
                "session_id": session.id,
                "grade_score": grade.score,
                "performance_label": evaluation.performance_label,
                "total_sessions": overview.total_sessions,
            }
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
