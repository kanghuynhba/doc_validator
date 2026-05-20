'use client';

import { useEffect, useState } from 'react';
import { getAnalytics, getLinearRegressionAnalysis } from '@/lib/api';
import { AnalyticsData, LinearRegressionAnalysis } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    format: (value: number) => value.toString(),
  },
  {
    key: 'average_llm_performance_score',
    label: 'LLM performance',
    format: (value: number) => value.toFixed(1),
  },
  {
    key: 'average_quiz_score',
    label: 'Quiz score',
    format: (value: number) => `${value.toFixed(1)}%`,
  },
  {
    key: 'average_summary_rating',
    label: 'Summary rating',
    format: (value: number) => value.toFixed(1),
  },
  {
    key: 'average_quiz_rating',
    label: 'Quiz rating',
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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-md bg-muted/40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-0 bg-card p-5 shadow-sm">
        <p className="font-medium text-rose-600">{error}</p>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="border-0 bg-card p-5 text-center shadow-sm">
        <p className="text-muted-foreground">No analytics data available</p>
      </Card>
    );
  }

  const performanceLabel =
    analytics.average_llm_performance_score >= 85
      ? 'Excellent'
      : analytics.average_llm_performance_score >= 70
      ? 'Good'
      : 'Needs review';

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-card shadow-sm">
        <div className="border-b border-border/70 px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">Evaluation metrics</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Current averages calculated from stored evaluations.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Metric</th>
                <th className="px-5 py-3 font-medium">Value</th>
                <th className="px-5 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {stats.map((stat) => {
                const value = analytics[stat.key];
                const note =
                  stat.key === 'average_llm_performance_score'
                    ? performanceLabel
                    : stat.key === 'total_sessions'
                    ? 'Uploaded sessions'
                    : 'Average across evaluated sessions';

                return (
                  <tr key={stat.key}>
                    <td className="px-5 py-3 font-medium text-foreground">{stat.label}</td>
                    <td className="px-5 py-3 text-foreground">{stat.format(value)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden border-0 bg-card shadow-sm">
        <div className="border-b border-border/50 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Linear regression fit</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Predicted LLM performance compared with actual evaluation scores.
              </p>
            </div>
            <Badge variant="outline">
              R² {regression?.r2_score == null ? 'n/a' : regression.r2_score.toFixed(3)}
            </Badge>
          </div>
        </div>
        {regression && regression.points.length >= 2 ? (
          <div className="px-4 py-5 sm:px-5">
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
                      <div className="min-w-44 rounded-md border border-border/60 bg-background px-3 py-2 text-xs shadow-lg">
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
        <Card className="overflow-hidden border-0 bg-card shadow-sm">
          <div className="border-b border-border/50 px-5 py-4">
            <h3 className="text-base font-semibold text-foreground">
              Top sessions
            </h3>
            <p className="text-sm text-muted-foreground">
              The strongest sessions by LLM performance score.
            </p>
          </div>
          <div className="divide-y divide-border/70">
            {analytics.top_performance_sessions.map((session) => (
              <div key={session.session_id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-foreground">{session.file_name}</p>
                  <p className="text-sm text-muted-foreground">{session.created_at}</p>
                </div>
                <Badge variant="secondary">
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
