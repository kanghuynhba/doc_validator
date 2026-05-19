from fastapi import HTTPException
from sqlalchemy.orm import Session as DBSession

from app.repositories import QuestionRepository
from app.repositories.quiz_repository import QuizAnswerRepository, QuizResultRepository
from app.schemas.grading import GradeItemResponse, GradeResponse


class Grader:
    def __init__(self, db: DBSession) -> None:
        self._db = db
        self._question_repo = QuestionRepository(db)
        self._quiz_result_repo = QuizResultRepository(db)
        self._quiz_answer_repo = QuizAnswerRepository(db)

    def grade(self, session_id: str, answers: dict[int, str]) -> GradeResponse:
        questions = self._question_repo.get_by_session(session_id)
        if not questions:
            raise HTTPException(status_code=404, detail="No quiz questions found for session")

        results: list[GradeItemResponse] = []
        correct = 0
        for question in questions:
            user_answer = answers.get(question.id, "").upper()
            is_correct = user_answer == question.correct_answer
            correct += int(is_correct)
            results.append(
                GradeItemResponse(
                    question_id=question.id,
                    user_answer=user_answer,
                    correct_answer=question.correct_answer,
                    is_correct=is_correct,
                    explanation=question.explanation,
                )
            )

        total = len(questions)
        score = round((correct / total) * 100, 2)
        quiz_result = self._quiz_result_repo.create(
            session_id=session_id,
            score=score,
            correct_answers=correct,
            total_questions=total,
        )

        answer_dicts = [
            {
                "question_id": r.question_id,
                "user_answer": r.user_answer,
                "correct_answer": r.correct_answer,
                "is_correct": r.is_correct,
            }
            for r in results
        ]
        self._quiz_answer_repo.bulk_create(quiz_result.id, answer_dicts)
        self._db.commit()

        return GradeResponse(score=score, correct=correct, total=total, results=results)
