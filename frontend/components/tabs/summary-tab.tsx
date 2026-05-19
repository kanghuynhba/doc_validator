'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/session-context';
import { getSummary } from '@/lib/api';
import { SummarySkeleton } from '../skeletons';
import { StarRating } from '../star-rating';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles } from 'lucide-react';

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
      <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
        <div className="border-b border-border/70 bg-gradient-to-r from-primary/5 via-background to-secondary/5 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Summary
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">No summary available</h2>
        </div>
        <div className="px-6 py-8 text-sm text-muted-foreground">
          The document summary could not be generated for this session.
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
      <div className="border-b border-border/70 bg-gradient-to-r from-primary/5 via-background to-secondary/5 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Summary
            </Badge>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Document summary
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            AI-generated from the uploaded PDF
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="rounded-3xl border border-border/70 bg-muted/25 p-5 sm:p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-[15px] leading-8 text-foreground">
              {summary}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Was this summary useful?
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Rate the quality so the model performance review stays grounded in your feedback.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <StarRating value={summaryRating || 0} onChange={setSummaryRating} size="lg" />
          </div>
        </div>
      </div>
    </Card>
  );
}
