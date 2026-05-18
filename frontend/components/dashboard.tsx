'use client';

import { useSession } from '@/lib/session-context';
import { SummaryTab } from './tabs/summary-tab';
import { QuizTab } from './tabs/quiz-tab';
import { ResultTab } from './tabs/result-tab';
import { AnalyticsTab } from './tabs/analytics-tab';
import { WorkspaceHeader } from './workspace-header';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function Dashboard() {
  const { sessionData, currentTab, error, setError } = useSession();

  // Analytics view (not in workspace)
  if (currentTab === 'analytics') {
    return <AnalyticsTab />;
  }

  // Workspace view
  return (
    <div className="flex-1 flex flex-col">
      <WorkspaceHeader />

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {/* Error Display */}
          {error && (
            <Card className="mb-6 p-4 border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Dismiss
                </button>
              </div>
            </Card>
          )}

          {/* Tab Content */}
          <div className="animate-in fade-in duration-200">
            {sessionData && currentTab === 'summary' && <SummaryTab />}
            {sessionData && currentTab === 'quiz' && <QuizTab />}
            {sessionData && currentTab === 'result' && <ResultTab />}
          </div>
        </div>
      </main>
    </div>
  );
}
