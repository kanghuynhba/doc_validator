'use client';

import { useSession } from '@/lib/session-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '../star-rating';

export function PerformanceTab() {
  const { evaluationResult, clearSession } = useSession();

  if (!evaluationResult) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No evaluation results available</p>
      </Card>
    );
  }

  const score = evaluationResult.llm_performance_score;
  const scoreColor =
    score >= 90
      ? 'text-green-600'
      : score >= 75
      ? 'text-blue-600'
      : score >= 60
      ? 'text-yellow-600'
      : 'text-red-600';

  const scoreBg =
    score >= 90
      ? 'bg-green-50 border-green-200'
      : score >= 75
      ? 'bg-blue-50 border-blue-200'
      : score >= 60
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-red-50 border-red-200';

  return (
    <div className="space-y-6">
      {/* Main Score */}
      <Card className={`p-8 border ${scoreBg}`}>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">LLM Performance Score</h2>
          <div className={`text-7xl font-bold ${scoreColor}`}>{score.toFixed(1)}</div>
          <p className="text-xl font-semibold text-foreground">
            {evaluationResult.performance_label}
          </p>
          <p className="text-sm text-muted-foreground pt-2">
            Based on summary quality, quiz quality, and quiz performance
          </p>
        </div>
      </Card>

      {/* Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Performance Breakdown</h3>
        <div className="space-y-4">
          {/* Summary Rating */}
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Summary Quality</p>
              <p className="text-sm text-muted-foreground">User rating</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-4 h-4 ${
                      star <= evaluationResult.summary_rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    ★
                  </div>
                ))}
              </div>
              <span className="font-semibold text-foreground">
                {evaluationResult.summary_rating}/5
              </span>
            </div>
          </div>

          {/* Quiz Rating */}
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Quiz Quality</p>
              <p className="text-sm text-muted-foreground">User rating</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-4 h-4 ${
                      star <= evaluationResult.quiz_rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    ★
                  </div>
                ))}
              </div>
              <span className="font-semibold text-foreground">
                {evaluationResult.quiz_rating}/5
              </span>
            </div>
          </div>

          {/* Quiz Score */}
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Quiz Performance</p>
              <p className="text-sm text-muted-foreground">Your score</p>
            </div>
            <span className="font-semibold text-foreground text-lg">
              {evaluationResult.quiz_score}%
            </span>
          </div>
        </div>
      </Card>

      {/* Feedback */}
      {evaluationResult.feedback && (
        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold text-foreground mb-2">Your Feedback</h3>
          <p className="text-foreground whitespace-pre-wrap">
            {evaluationResult.feedback}
          </p>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => clearSession()}
          variant="outline"
          size="lg"
          className="flex-1"
        >
          Start Over
        </Button>
        <Button
          onClick={() => clearSession()}
          size="lg"
          className="flex-1"
        >
          View All Sessions
        </Button>
      </div>
    </div>
  );
}
