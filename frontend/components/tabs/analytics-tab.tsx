'use client';

import { useEffect, useState } from 'react';
import { getAnalytics, getLinearRegressionAnalysis } from '@/lib/api';
import { AnalyticsData, LinearRegressionAnalysis } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, BrainCircuit, FileText, Star, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
} from 'recharts';

const stats = [
  {
    key: 'total_sessions',
    label: 'Total sessions',
    icon: FileText,
    format: (value: number) => value.toString(),
  },
  {
    key: 'average_llm_performance_score',
    label: 'Avg. LLM performance',
    icon: Target,
    format: (value: number) => value.toFixed(1),
  },
  {
    key: 'average_quiz_score',
    label: 'Avg. quiz score',
    icon: BarChart3,
    format: (value: number) => `${value.toFixed(1)}%`,
  },
  {
    key: 'average_summary_rating',
    label: 'Avg. summary rating',
    icon: Star,
    format: (value: number) => value.toFixed(1),
  },
  {
    key: 'average_quiz_rating',
    label: 'Avg. quiz rating',
    icon: BrainCircuit,
    format: (value: number) => value.toFixed(1),
  },
] as const;

export function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [regression, setRegression] = useState<LinearRegressionAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [data, regressionData] = await Promise.all([
          getAnalytics(),
          getLinearRegressionAnalysis(),
        ]);
        setAnalytics(data);
        setRegression(regressionData);
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-3xl bg-muted/40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-border/70 bg-card/90 p-6 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
        <p className="font-medium text-rose-600">{error}</p>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="border-border/70 bg-card/90 p-6 text-center shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
        <p className="text-muted-foreground">No analytics data available</p>
      </Card>
    );
  }

  const performanceClass =
    analytics.average_llm_performance_score >= 85
      ? 'from-emerald-500/10 to-emerald-500/5 text-emerald-700 dark:text-emerald-300'
      : analytics.average_llm_performance_score >= 70
      ? 'from-sky-500/10 to-sky-500/5 text-sky-700 dark:text-sky-300'
      : 'from-amber-500/10 to-amber-500/5 text-amber-700 dark:text-amber-300';

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
        <div className="bg-gradient-to-br from-primary/8 via-background to-secondary/10 px-6 py-6 sm:px-8">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit rounded-full border-primary/20 bg-primary/5 text-primary">
              <BarChart3 className="mr-2 h-3.5 w-3.5" />
              Analytics
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Session performance overview
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Compare the quality of summaries, quiz generation, and model performance across
              all recorded sessions.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const value = analytics[stat.key];

          return (
            <Card
              key={stat.key}
              className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]"
            >
              <div className="flex h-full flex-col justify-between p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-4xl font-semibold tracking-tight text-foreground">
                      {stat.format(value)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className={cn('overflow-hidden border-border/70 bg-gradient-to-br shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]', performanceClass)}>
        <div className="px-6 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            LLM performance
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {analytics.average_llm_performance_score.toFixed(1)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Average model quality across all sessions
              </p>
            </div>
            <p className="text-sm font-medium text-foreground">
              {analytics.average_llm_performance_score >= 85
                ? 'Excellent overall performance'
                : analytics.average_llm_performance_score >= 70
                ? 'Good, with room to improve'
                : 'Needs improvement'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Linear regression fit
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Predicted LLM performance compared with actual evaluation scores.
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full">
              R² {regression?.r2_score == null ? 'n/a' : regression.r2_score.toFixed(3)}
            </Badge>
          </div>
        </div>
        {regression && regression.points.length >= 2 ? (
          <div className="px-4 py-5 sm:px-6">
            <ChartContainer
              config={{
                actual_score: {
                  label: 'Actual score',
                  color: 'var(--chart-2)',
                },
                ideal_score: {
                  label: 'Ideal fit',
                  color: 'var(--chart-1)',
                },
              }}
              className="h-[320px] w-full"
            >
              <ComposedChart margin={{ left: 8, right: 14, top: 10, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="predicted_score"
                  type="number"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  name="Predicted"
                  unit="%"
                />
                <YAxis
                  dataKey="actual_score"
                  type="number"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  name="Actual"
                  unit="%"
                />
                <ChartTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    const point = payload?.find((item) => item.payload?.file_name)?.payload;
                    if (!active || !point) return null;

                    return (
                      <div className="min-w-44 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs shadow-xl">
                        <p className="truncate font-medium text-foreground">{point.file_name}</p>
                        <p className="mt-1 text-muted-foreground">
                          Predicted: {point.predicted_score.toFixed(1)}%
                        </p>
                        <p className="text-muted-foreground">
                          Actual: {point.actual_score.toFixed(1)}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Line
                  data={regression.line}
                  dataKey="ideal_score"
                  name="Ideal fit"
                  type="linear"
                  stroke="var(--color-ideal_score)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Scatter
                  data={regression.points}
                  dataKey="actual_score"
                  name="Actual score"
                  fill="var(--color-actual_score)"
                />
              </ComposedChart>
            </ChartContainer>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <span>{regression.sample_count} evaluated sessions</span>
              <span>X-axis: predicted score</span>
              <span>Y-axis: actual score</span>
            </div>
          </div>
        ) : (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            At least two completed evaluations are required to draw the regression diagram.
          </div>
        )}
      </Card>

      {analytics.top_performance_sessions?.length ? (
        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
          <div className="border-b border-border/70 px-6 py-5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Top sessions
            </h3>
            <p className="text-sm text-muted-foreground">
              The strongest sessions by LLM performance score.
            </p>
          </div>
          <div className="divide-y divide-border/70">
            {analytics.top_performance_sessions.map((session) => (
              <div key={session.session_id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-foreground">{session.file_name}</p>
                  <p className="text-sm text-muted-foreground">{session.created_at}</p>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {session.llm_performance_score.toFixed(1)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
