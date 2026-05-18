'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/session-context';
import { getSummary } from '@/lib/api';
import { SummarySkeleton } from '../skeletons';
import { StarRating } from '../star-rating';
import { Card } from '@/components/ui/card';

export function SummaryTab() {
  const {
    sessionData,
    summary,
    setSummary,
    summaryRating,
    setSummaryRating,
    isLoading,
    setIsLoading,
    setError,
  } = useSession();

  useEffect(() => {
    if (!sessionData || summary) return;

    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getSummary(sessionData.session_id);
        setSummary(response.summary);
      } catch (err) {
        setError(`Failed to fetch summary: ${(err as Error).message}`);
        console.error('[v0] Summary fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [sessionData, summary, setSummary, setIsLoading, setError]);

  if (isLoading) {
    return <SummarySkeleton />;
  }

  if (!summary) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No summary available</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Document Summary
          </h2>
          <div className="text-foreground leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        </div>

        {/* Rating Section */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Was this summary useful?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Help us improve by rating the quality of this summary
              </p>
            </div>
            <StarRating
              value={summaryRating || 0}
              onChange={setSummaryRating}
              size="lg"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
