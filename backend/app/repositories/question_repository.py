from app.models.question import Question


class QuestionRepository:
    def __init__(self, db) -> None:
        self._db = db

    def create(
        self,
        session_id: str,
        question_text: str,
        choice_a: str,
        choice_b: str,
        choice_c: str,
        choice_d: str,
        correct_answer: str,
        explanation: str,
    ) -> Question:
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

    def bulk_create(self, session_id: str, questions: list[dict]) -> list[Question]:
        models = [Question(session_id=session_id, **question) for question in questions]
        self._db.add_all(models)
        self._db.flush()
        return models

    def get_by_session(self, session_id: str) -> list[Question]:
        return self._db.query(Question).filter(Question.session_id == session_id).all()
