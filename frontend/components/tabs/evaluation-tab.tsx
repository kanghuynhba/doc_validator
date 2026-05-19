'use client';

import { useState } from 'react';
import { useSession } from '@/lib/session-context';
import { evaluateLLM } from '@/lib/api';
import { StarRating } from '../star-rating';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function EvaluationTab() {
  const {
    sessionData,
    gradeResult,
    setCurrentTab,
    setError,
    setEvaluationResult,
  } = useSession();

  const [summaryRating, setSummaryRating] = useState(0);
  const [quizRating, setQuizRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!sessionData || !gradeResult) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Please complete the quiz first</p>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (summaryRating === 0 || quizRating === 0) {
      setError('Please rate both the summary and quiz');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await evaluateLLM(sessionData.session_id, {
        summary_rating: summaryRating,
        quiz_rating: quizRating,
        feedback: feedback || '',
      });
      setEvaluationResult(result);
      setCurrentTab('performance');
    } catch (err) {
      setError(`Failed to submit evaluation: ${(err as Error).message}`);
      console.error('[v0] Evaluation submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Evaluate LLM Performance</h2>
        <p className="text-sm text-muted-foreground">
          Your feedback helps us understand how well the AI performed
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-8">
          {/* Summary Rating */}
          <div>
            <StarRating
              value={summaryRating}
              onChange={setSummaryRating}
              size="lg"
              label="How would you rate the quality of the summary?"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Consider accuracy, completeness, and clarity
            </p>
          </div>

          {/* Quiz Rating */}
          <div>
            <StarRating
              value={quizRating}
              onChange={setQuizRating}
              size="lg"
              label="How would you rate the quality of the quiz?"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Consider relevance, difficulty, and learning value
            </p>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Additional Feedback (Optional)
            </label>
            <Textarea
              placeholder="Share any specific feedback about the summary or quiz..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Quiz Score Info */}
      {gradeResult && (
        <Card className="p-4 bg-muted/50 border-muted">
          <p className="text-sm text-foreground">
            <span className="font-medium">Quiz Score:</span> {gradeResult.score} out of{' '}
            {gradeResult.total_questions} ({gradeResult.percentage.toFixed(1)}%)
          </p>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || summaryRating === 0 || quizRating === 0}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? 'Calculating...' : 'View LLM Performance Score'}
      </Button>
    </div>
  );
}
