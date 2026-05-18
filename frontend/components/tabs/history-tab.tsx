'use client';

import { useEffect, useState } from 'react';
import { getHistory } from '@/lib/api';
import { HistoryEntry } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { HistorySkeleton } from '../skeletons';

export function HistoryTab() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getHistory();
        setHistory(data);
      } catch (err) {
        setError(`Failed to load history: ${(err as Error).message}`);
        console.error('[v0] History fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (isLoading) {
    return <HistorySkeleton />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-600 font-medium">{error}</p>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No sessions yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Session History</h2>
        <p className="text-sm text-muted-foreground">
          All your previous documents and evaluations
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-semibold text-foreground">File</th>
              <th className="text-left p-3 font-semibold text-foreground">Date</th>
              <th className="text-center p-3 font-semibold text-foreground">Summary</th>
              <th className="text-center p-3 font-semibold text-foreground">Quiz</th>
              <th className="text-center p-3 font-semibold text-foreground">Score</th>
              <th className="text-center p-3 font-semibold text-foreground">LLM Score</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.session_id} className="border-b border-border hover:bg-muted/50">
                <td className="p-3 text-foreground font-medium">{entry.file_name}</td>
                <td className="p-3 text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString()}
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= entry.summary_rating
                            ? 'text-yellow-500'
                            : 'text-muted-foreground'
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= entry.quiz_rating
                            ? 'text-yellow-500'
                            : 'text-muted-foreground'
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-center text-foreground font-medium">
                  {entry.quiz_score}%
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      entry.llm_performance_score >= 85
                        ? 'bg-green-100 text-green-800'
                        : entry.llm_performance_score >= 70
                        ? 'bg-blue-100 text-blue-800'
                        : entry.llm_performance_score >= 50
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {entry.llm_performance_score.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
