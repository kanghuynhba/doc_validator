from fastapi import HTTPException
from sqlalchemy.orm import Session as DBSession

from app.models.question import Question
from app.models.quiz_answer import QuizAnswer
from app.models.quiz_result import QuizResult
from app.schemas.grading import GradeItemResponse, GradeResponse


class Grader:
    def __init__(self, db: DBSession) -> None:
        self.db = db

    def grade(self, session_id: str, answers: dict[int, str]) -> GradeResponse:
        questions = self.db.query(Question).filter(Question.session_id == session_id).all()
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
        quiz_result = QuizResult(session_id=session_id, score=score, correct_answers=correct, total_questions=total)
        self.db.add(quiz_result)
        self.db.flush()
        for result in results:
            self.db.add(
                QuizAnswer(
                    quiz_result_id=quiz_result.id,
                    question_id=result.question_id,
                    user_answer=result.user_answer,
                    correct_answer=result.correct_answer,
                    is_correct=result.is_correct,
                )
            )
        self.db.commit()
        return GradeResponse(score=score, correct=correct, total=total, results=results)
