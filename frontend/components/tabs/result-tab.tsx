'use client';

import { useState } from 'react';
import { useSession } from '@/lib/session-context';
import { evaluateLLM } from '@/lib/api';
import { StarRating } from '../star-rating';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Target, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ResultTab() {
  const {
    gradeResult,
    summaryRating,
    setSummaryRating,
    quizRating,
    setQuizRating,
    feedback,
    setFeedback,
    evaluationResult,
    setEvaluationResult,
    sessionData,
    setError,
  } = useSession();

  const [submittingEval, setSubmittingEval] = useState(false);

  if (!gradeResult) {
    return (
      <Card className="border-border/70 bg-card/90 p-6 text-center shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
        <p className="text-muted-foreground">No quiz results available</p>
      </Card>
    );
  }

  const percentage = gradeResult.percentage;
  const performanceColor =
    percentage >= 85
      ? 'text-emerald-600'
      : percentage >= 70
      ? 'text-sky-600'
      : percentage >= 50
      ? 'text-amber-600'
      : 'text-rose-600';

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
    } finally {
      setSubmittingEval(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
        <div className="bg-gradient-to-br from-primary/8 via-background to-secondary/10 px-6 py-8 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-3">
              <Badge variant="outline" className="w-fit rounded-full border-primary/20 bg-primary/5 text-primary">
                <Target className="mr-2 h-3.5 w-3.5" />
                Results
              </Badge>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Quiz complete
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Review your score, check each answer, then rate the summary and quiz so the
                model evaluation can be generated.
              </p>
            </div>

            <div className="rounded-[2rem] border border-border/70 bg-background/85 px-8 py-6 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Score
              </p>
              <div className={cn('mt-2 text-5xl font-semibold tracking-tight sm:text-6xl', performanceColor)}>
                {percentage.toFixed(1)}%
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {gradeResult.score} of {gradeResult.total_questions} correct
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Review your answers
        </h3>
        {gradeResult.questions.map((q, index) => (
          <Card
            key={q.question_id}
            className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-start gap-4 border-b border-border/70 bg-muted/20 px-6 py-5">
              {q.is_correct ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    {index + 1}
                  </Badge>
                  <h4 className="text-base font-semibold leading-7 text-foreground sm:text-lg">
                    {q.question}
                  </h4>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Your answer
                    </p>
                    <p className={cn('mt-2 font-medium', q.is_correct ? 'text-emerald-600' : 'text-rose-600')}>
                      {q.options[q.user_answer]}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Correct answer
                    </p>
                    <p className="mt-2 font-medium text-emerald-600">
                      {q.options[q.correct_answer]}
                    </p>
                  </div>
                </div>

                {q.explanation && (
                  <div className="rounded-2xl border border-border/70 bg-muted/25 p-4 text-sm leading-6 text-muted-foreground">
                    {q.explanation}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!evaluationResult && (
        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
          <div className="border-b border-border/70 bg-gradient-to-r from-primary/5 via-background to-secondary/5 px-6 py-5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Rate the summary and quiz
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Your ratings feed into the learning effectiveness score.
            </p>
          </div>

          <div className="space-y-6 px-6 py-6">
            <StarRating
              value={summaryRating || 0}
              onChange={setSummaryRating}
              size="lg"
              label="Summary quality"
            />

            <StarRating
              value={quizRating || 0}
              onChange={setQuizRating}
              size="lg"
              label="Quiz quality"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Optional feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add a short note about the summary, quiz, or overall usefulness..."
                className="min-h-28 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {summaryRating === null
                  ? 'Rate the summary before submitting the evaluation.'
                  : 'Submit when you are ready to generate the effectiveness score.'}
              </p>
              <Button
                onClick={handleSubmitEvaluation}
                disabled={!canSubmitEval}
                size="lg"
                className="rounded-full px-6"
              >
                {submittingEval && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submittingEval ? 'Submitting...' : 'Submit evaluation'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {evaluationResult && (
        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
          <div className="bg-gradient-to-br from-primary/8 via-background to-secondary/10 px-6 py-6">
            <div className="space-y-2">
              <Badge variant="outline" className="w-fit rounded-full border-primary/20 bg-primary/5 text-primary">
                Performance
              </Badge>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Learning effectiveness score
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Combined evaluation of summary quality, quiz quality, and learning outcome.
              </p>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="Summary quality"
                value={`${Math.round((evaluationResult.summary_rating / 5) * 100)}%`}
              />
              <MetricCard
                label="Quiz quality"
                value={`${Math.round((evaluationResult.quiz_rating / 5) * 100)}%`}
              />
              <MetricCard
                label="Learning outcome"
                value={`${Math.round(evaluationResult.quiz_score)}%`}
              />
            </div>

            <div className="rounded-3xl border border-border/70 bg-muted/25 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Final score
              </p>
              <p className="mt-3 text-5xl font-semibold tracking-tight text-primary sm:text-6xl">
                {Math.round(evaluationResult.llm_performance_score)}
              </p>
              <p className="mt-2 text-lg font-medium text-foreground">
                {evaluationResult.performance_label}
              </p>
            </div>

            {evaluationResult.feedback && (
              <div className="rounded-3xl border border-border/70 bg-background/70 p-5">
                <p className="text-sm font-semibold text-foreground">Your feedback</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {evaluationResult.feedback}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
