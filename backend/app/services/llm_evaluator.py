class LLMEvaluator:
    def evaluate(
        self,
        summary_rating: int,
        quiz_rating: int,
        correct_answers: int,
        total_questions: int,
    ) -> dict[str, float | str]:
        summary_satisfaction = summary_rating / 5 * 100
        quiz_satisfaction = quiz_rating / 5 * 100
        learning_outcome = (correct_answers / total_questions * 100) if total_questions else 0
        score = round(
            0.4 * summary_satisfaction + 0.3 * quiz_satisfaction + 0.3 * learning_outcome,
            2,
        )
        if score >= 80:
            label = "Excellent"
        elif score >= 65:
            label = "Good"
        elif score >= 50:
            label = "Average"
        else:
            label = "Poor"
        return {
            "summary_satisfaction": round(summary_satisfaction, 2),
            "quiz_satisfaction": round(quiz_satisfaction, 2),
            "learning_outcome": round(learning_outcome, 2),
            "llm_performance_score": score,
            "performance_label": label,
        }
