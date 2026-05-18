'use client';

import { useState } from 'react';
import { useSession } from '@/lib/session-context';
import { evaluateLLM } from '@/lib/api';
import { StarRating } from '../star-rating';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function ResultTab() {
  const {
    gradeResult,
    summaryRating,
    quizRating,
    setQuizRating,
    feedback,
    setFeedback,
    evaluationResult,
    setEvaluationResult,
    sessionData,
    isLoading,
    setIsLoading,
    setError,
  } = useSession();

  const [submittingEval, setSubmittingEval] = useState(false);

  if (!gradeResult) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No quiz results available</p>
      </Card>
    );
  }

  const percentage = gradeResult.percentage;
  const performanceColor =
    percentage >= 85
      ? 'text-green-600'
      : percentage >= 70
      ? 'text-blue-600'
      : percentage >= 50
      ? 'text-yellow-600'
      : 'text-red-600';

  const canSubmitEval =
    summaryRating !== null &&
    quizRating !== null &&
    sessionData &&
    !evaluationResult &&
    !submittingEval;

  const handleSubmitEvaluation = async () => {
    if (!sessionData || summaryRating === null || quizRating === null) return;

    setSubmittingEval(true);
    setError(null);

    try {
      const result = await evaluateLLM(sessionData.session_id, {
        summary_rating: summaryRating,
        quiz_rating: quizRating,
        feedback,
      });
      setEvaluationResult(result);
    } catch (err) {
      setError(`Failed to submit evaluation: ${(err as Error).message}`);
      console.error('[v0] Evaluation submission error:', err);
    } finally {
      setSubmittingEval(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Quiz Complete!</h2>
          <div className={`text-6xl font-bold ${performanceColor}`}>
            {gradeResult.percentage.toFixed(1)}%
          </div>
          <p className="text-lg text-foreground">
            {gradeResult.score} out of {gradeResult.total_questions} correct
          </p>
        </div>
      </Card>

      {/* Questions Review */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Review Your Answers</h3>
        {gradeResult.questions.map((q, index) => (
          <Card key={q.question_id} className="p-4">
            <div className="flex items-start gap-3">
              {q.is_correct ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-2">
                  {index + 1}. {q.question}
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Your answer: </span>
                    <span className={q.is_correct ? 'text-green-600' : 'text-red-600'}>
                      {q.options[q.user_answer]}
                    </span>
                  </div>
                  {!q.is_correct && (
                    <div>
                      <span className="font-medium text-foreground">Correct answer: </span>
                      <span className="text-green-600">{q.options[q.correct_answer]}</span>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="pt-2 text-muted-foreground italic border-t border-border">
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quiz Rating Section */}
      {!evaluationResult && (
        <Card className="p-6 border-primary/20">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground">How useful was this quiz?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Rate the quality and relevance of the questions
              </p>
            </div>

            <StarRating
              value={quizRating || 0}
              onChange={setQuizRating}
              size="lg"
            />

            {/* Feedback Section */}
            <div className="pt-4 border-t border-border">
              <label className="block text-sm font-medium text-foreground mb-2">
                Optional Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share any feedback about the summary or quiz..."
                className="w-full p-3 text-sm border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitEvaluation}
              disabled={!canSubmitEval}
              size="lg"
              className="w-full"
            >
              {submittingEval && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submittingEval ? 'Submitting...' : 'Submit Evaluation'}
            </Button>
            {summaryRating === null && (
              <p className="text-sm text-muted-foreground text-center">
                Rate the summary before submitting the evaluation.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* LLM Performance Card */}
      {evaluationResult && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-primary/20">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                LLM Learning Effectiveness
              </h3>
              <p className="text-sm text-muted-foreground">
                Combined evaluation of your learning experience
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-background/50 rounded-md border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Summary Quality
                </p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(
                    (evaluationResult.summary_rating / 5) * 100
                  )}%
                </p>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-md border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Quiz Quality
                </p>
                <p className="text-2xl font-bold text-accent">
                  {Math.round((evaluationResult.quiz_rating / 5) * 100)}%
                </p>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-md border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Learning Outcome
                </p>
                <p className="text-2xl font-bold text-secondary">
                  {Math.round(evaluationResult.quiz_score)}%
                </p>
              </div>
            </div>

            {/* Final Score */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">LLM Performance Score</p>
              <p className="text-5xl font-bold text-primary mb-2">
                {Math.round(evaluationResult.llm_performance_score)}/100
              </p>
              <p className="text-lg font-semibold text-foreground">
                {evaluationResult.performance_label}
              </p>
            </div>

            {/* Formula Explanation */}
            <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
              <p className="font-medium text-foreground mb-2">Score Formula</p>
              <p>
                0.4 × Summary Quality + 0.3 × Quiz Quality + 0.3 × Learning Outcome
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
