'use client';

import { useSession } from '@/lib/session-context';
import { SummaryTab } from './tabs/summary-tab';
import { QuizTab } from './tabs/quiz-tab';
import { ResultTab } from './tabs/result-tab';
import { AnalyticsTab } from './tabs/analytics-tab';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, BarChart3, FileText, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'summary', label: 'Summary' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'result', label: 'Review' },
] as const;

export function Dashboard() {
  const {
    sessionData,
    currentTab,
    error,
    setError,
    setCurrentTab,
    clearSession,
  } = useSession();

  if (currentTab === 'analytics') {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-border/70 bg-card/85 px-6 py-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Overview
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Analytics dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Review aggregate quality scores across all sessions.
            </p>
          </div>
          <Button onClick={clearSession} variant="outline" className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to upload
          </Button>
        </div>

        <AnalyticsTab />
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
      <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.4)] backdrop-blur">
        <div className="bg-gradient-to-r from-primary/8 via-background to-secondary/8 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="w-fit rounded-full border-primary/20 bg-primary/5 text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Workspace ready
              </Badge>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {sessionData.file_name}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Your document is loaded. Move through the summary, quiz, and review
                  steps in one focused flow.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                <FileText className="mr-2 h-3.5 w-3.5" />
                {sessionData.num_questions} questions
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {formatDistanceToNow(new Date(sessionData.created_at), {
                  addSuffix: true,
                })}
              </Badge>
              <Button onClick={clearSession} variant="ghost" className="rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                New document
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border/70 px-3 py-3 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                variant={currentTab === tab.id ? 'default' : 'ghost'}
                className={cn(
                  'rounded-full px-4',
                  currentTab === tab.id
                    ? 'shadow-[0_10px_25px_-15px_rgba(59,130,246,0.5)]'
                    : 'text-muted-foreground'
                )}
              >
                {tab.label}
              </Button>
            ))}
            <Button
              onClick={() => setCurrentTab('analytics')}
              variant="outline"
              className="rounded-full px-4"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </div>
        </div>
      </Card>

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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {currentTab === 'summary' && <SummaryTab />}
            {currentTab === 'quiz' && <QuizTab />}
            {currentTab === 'result' && <ResultTab />}
          </div>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <Card className="border-border/70 bg-card/90 p-5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Session
            </p>
            <div className="mt-4 space-y-3">
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
          </Card>

          <Card className="border-border/70 bg-gradient-to-br from-primary/8 via-card to-secondary/10 p-5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Flow
            </p>
            <div className="mt-4 space-y-3">
              {tabs.map((tab, index) => (
                <div
                  key={tab.id}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3 transition',
                    currentTab === tab.id
                      ? 'border-primary/20 bg-primary/8'
                      : 'border-border/70 bg-background/70'
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tab.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {tab.id === 'summary'
                        ? 'Read the document summary'
                        : tab.id === 'quiz'
                        ? 'Answer the generated quiz'
                        : 'Check your score and feedback'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
