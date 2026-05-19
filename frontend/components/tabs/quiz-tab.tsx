'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/session-context';
import { getQuiz, submitQuiz } from '@/lib/api';
import { QuizQuestion, QuizAnswers } from '@/lib/types';
import { QuizSkeleton } from '../skeletons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

export function QuizTab() {
  const {
    sessionData,
    setCurrentTab,
    isLoading,
    setIsLoading,
    setError,
    setGradeResult,
  } = useSession();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionData || questions.length > 0) return;

    const fetchQuiz = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getQuiz(sessionData.session_id);
        setQuestions(response.questions);
        const initialAnswers: QuizAnswers = {};
        response.questions.forEach((question) => {
          initialAnswers[question.question_id] = -1;
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setError(`Failed to fetch quiz: ${(err as Error).message}`);
        console.error('[v0] Quiz fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [sessionData, questions.length, setIsLoading, setError]);

  const answeredCount = Object.values(answers).filter((answer) => answer !== -1).length;

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!sessionData) return;

    const allAnswered = questions.every((question) => answers[question.question_id] !== -1);
    if (!allAnswered) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitQuiz(sessionData.session_id, answers, questions);
      setGradeResult(result);
      setCurrentTab('result');
    } catch (err) {
      setError(`Failed to submit quiz: ${(err as Error).message}`);
      console.error('[v0] Quiz submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <QuizSkeleton />;
  }

  if (questions.length === 0) {
    return (
      <Card className="border-border/70 bg-card/90 p-6 text-center shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
        <p className="text-muted-foreground">No quiz available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
        <div className="border-b border-border/70 bg-gradient-to-r from-primary/5 via-background to-secondary/5 px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Quiz
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Answer the questions below, then submit to see your score.
          </p>
        </div>
      </Card>

      <div className="space-y-4">
        {questions.map((question, qIndex) => (
          <Card
            key={question.question_id}
            className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]"
          >
            <div className="border-b border-border/70 bg-muted/20 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Question {qIndex + 1}
                  </p>
                  <h3 className="text-lg font-semibold leading-7 text-foreground sm:text-xl">
                    {question.question}
                  </h3>
                </div>
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                    answers[question.question_id] !== -1
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-border/70 bg-background text-muted-foreground'
                  )}
                >
                  {answers[question.question_id] !== -1 ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 px-6 py-5">
              {question.options.map((option, oIndex) => {
                const selected = answers[question.question_id] === oIndex;

                return (
                  <button
                    key={oIndex}
                    type="button"
                    onClick={() => handleAnswerChange(question.question_id, oIndex)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-200',
                      selected
                        ? 'border-primary/30 bg-primary/8 shadow-[0_8px_24px_-20px_rgba(59,130,246,0.45)]'
                        : 'border-border/70 bg-background/60 hover:border-primary/25 hover:bg-primary/5'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {String.fromCharCode(65 + oIndex)}
                    </span>
                    <span className="flex-1 text-sm leading-6 text-foreground sm:text-base">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-border/70 bg-card/90 p-4 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.4)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {answeredCount} of {questions.length} answered
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || answeredCount !== questions.length}
            size="lg"
            className="rounded-full px-6"
          >
            {isSubmitting ? 'Submitting...' : 'Submit quiz'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
