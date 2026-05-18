'use client';

import { useEffect, useState } from 'react';
import { getAnalytics } from '@/lib/api';
import { AnalyticsData } from '@/lib/types';
import { Card } from '@/components/ui/card';

export function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(`Failed to load analytics: ${(err as Error).message}`);
        console.error('[v0] Analytics fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-600 font-medium">{error}</p>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No analytics data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Overall performance metrics across all sessions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Sessions */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Sessions</h3>
          <p className="text-4xl font-bold text-blue-600">
            {analytics.total_sessions}
          </p>
        </Card>

        {/* Average LLM Score */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Avg LLM Performance
          </h3>
          <p className="text-4xl font-bold text-green-600">
            {analytics.average_llm_performance_score.toFixed(1)}
          </p>
        </Card>

        {/* Average Quiz Score */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Avg Quiz Score
          </h3>
          <p className="text-4xl font-bold text-purple-600">
            {analytics.average_quiz_score.toFixed(1)}%
          </p>
        </Card>

        {/* Average Summary Rating */}
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Avg Summary Rating
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-4xl font-bold text-yellow-600">
              {analytics.average_summary_rating.toFixed(1)}
            </p>
            <span className="text-2xl">★</span>
          </div>
        </Card>

        {/* Average Quiz Rating */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Avg Quiz Rating
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-4xl font-bold text-orange-600">
              {analytics.average_quiz_rating.toFixed(1)}
            </p>
            <span className="text-2xl">★</span>
          </div>
        </Card>
      </div>

      {/* Performance Label */}
      {analytics.average_llm_performance_score >= 85 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-800 font-medium">
            ✓ Overall LLM performance is excellent!
          </p>
        </Card>
      )}
      {analytics.average_llm_performance_score >= 70 &&
        analytics.average_llm_performance_score < 85 && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              ○ LLM performance is good with room for improvement
            </p>
          </Card>
        )}
      {analytics.average_llm_performance_score < 70 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800 font-medium">
            ! LLM performance needs improvement
          </p>
        </Card>
      )}
    </div>
  );
}
