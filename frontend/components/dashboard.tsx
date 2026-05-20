'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/session-context';
import { SummaryTab } from './tabs/summary-tab';
import { QuizTab } from './tabs/quiz-tab';
import { ResultTab } from './tabs/result-tab';
import { AnalyticsTab } from './tabs/analytics-tab';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, BarChart3, CheckCircle2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'summary', label: 'Summary' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'result', label: 'Review' },
] as const;

export function Dashboard() {
  const router = useRouter();
  const {
    sessionData,
    currentTab,
    error,
    setError,
    setCurrentTab,
    clearSession,
  } = useSession();

  const goToDashboard = () => {
    clearSession();
    router.push('/dashboard');
  };

  const selectTab = (tab: typeof tabs[number]) => {
    setCurrentTab(tab.id);
    router.push('/workspace');
  };

  if (currentTab === 'analytics') {
    return (
      <div className="flex w-full flex-1 flex-col gap-6">
        <header className="flex items-center justify-between gap-4 border-b border-border/70 bg-layout-header px-4 py-4 sm:px-6 lg:px-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Analysis
            </h1>
            <p className="text-sm text-muted-foreground">
              Review aggregate quality scores across all sessions.
            </p>
          </div>
          <Button onClick={goToDashboard} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to upload
          </Button>
        </header>

        <AnalyticsTab />
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      <header className="border-b border-border/70 bg-layout-header px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <button
              type="button"
              onClick={goToDashboard}
              className="inline-flex w-fit items-center text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              New document
            </button>
            <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {sessionData.file_name}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Work through the generated summary, quiz, and review for this document.
            </p>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <Card className="border-amber-200/70 bg-amber-50/80 px-5 py-4 text-amber-950 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
            <div className="flex-1">
              <p className="text-sm leading-6">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="rounded-full px-3 py-1 text-sm font-medium text-amber-700 transition hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-950/40"
            >
              Dismiss
            </button>
          </div>
        </Card>
      )}

      <div className="grid flex-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-border/70 bg-layout-sidebar">
          <nav className="space-y-6 px-4 py-5 lg:sticky lg:top-0">
            <div>
              <p className="text-sm font-semibold text-foreground">Workspace</p>
              <p className="mt-1 text-xs text-muted-foreground">Document workflow</p>
            </div>

            <div className="space-y-1">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectTab(tab)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition',
                      currentTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {currentTab === tab.id ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-xs">
                        {index + 1}
                      </span>
                    )}
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
            </div>

            <div className="border-t border-border/70 pt-4">
              <Button
                onClick={() => {
                  setCurrentTab('analytics');
                  router.push('/analysis');
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analysis
              </Button>
            </div>

            <div className="space-y-3 border-t border-border/70 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Document
              </p>
              <div>
                <p className="text-sm text-muted-foreground">Document</p>
                <p className="mt-1 font-medium text-foreground">{sessionData.file_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="mt-1 font-medium text-foreground">
                  {formatDistanceToNow(new Date(sessionData.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="mt-1 font-medium text-foreground">{sessionData.num_questions}</p>
              </div>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {currentTab === 'summary' && <SummaryTab />}
            {currentTab === 'quiz' && <QuizTab />}
            {currentTab === 'result' && <ResultTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
