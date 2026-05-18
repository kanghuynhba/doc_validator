'use client';

export function SummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-muted rounded-lg w-1/3 animate-pulse" />
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 bg-muted rounded-lg w-5/6 animate-pulse" />
      </div>
      <div className="space-y-3 pt-4">
        <div className="h-4 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 bg-muted rounded-lg w-4/5 animate-pulse" />
      </div>
    </div>
  );
}

export function QuizSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-3">
          <div className="h-6 bg-muted rounded-lg w-4/5 animate-pulse" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-10 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-muted rounded-lg w-1/2 animate-pulse" />
      <div className="h-32 bg-muted rounded-lg animate-pulse" />
      <div className="space-y-3 pt-4">
        <div className="h-6 bg-muted rounded-lg w-1/3 animate-pulse" />
        <div className="h-4 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 bg-muted rounded-lg w-5/6 animate-pulse" />
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
