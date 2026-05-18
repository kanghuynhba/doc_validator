'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/session-context';
import { getQuiz, submitQuiz } from '@/lib/api';
import { QuizQuestion, QuizAnswers } from '@/lib/types';
import { QuizSkeleton } from '../skeletons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch quiz questions
  useEffect(() => {
    if (!sessionData || questions.length > 0) return;

    const fetchQuiz = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getQuiz(sessionData.session_id);
        setQuestions(response.questions);
        // Initialize answers object
        const initialAnswers: QuizAnswers = {};
        response.questions.forEach((q) => {
          initialAnswers[q.question_id] = -1;
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
  }, [sessionData, questions, setIsLoading, setError]);

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!sessionData) return;

    // Check if all questions answered
    const allAnswered = questions.every((q) => answers[q.question_id] !== -1);
    if (!allAnswered) {
      setError('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitQuiz(sessionData.session_id, answers, questions);
      setGradeResult(result);
      setSubmitted(true);
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
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No quiz available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Quiz</h2>
        <p className="text-sm text-muted-foreground">
          {Object.values(answers).filter((a) => a !== -1).length} of {questions.length}{' '}
          questions answered
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((question, qIndex) => (
          <Card key={question.question_id} className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {qIndex + 1}. {question.question}
            </h3>
            <div className="space-y-2">
              {question.options.map((option, oIndex) => (
                <label key={oIndex} className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="radio"
                    name={question.question_id}
                    value={oIndex}
                    checked={answers[question.question_id] === oIndex}
                    onChange={() => handleAnswerChange(question.question_id, oIndex)}
                    className="mr-3"
                  />
                  <span className="text-foreground">{option}</span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
      </Button>
    </div>
  );
}
