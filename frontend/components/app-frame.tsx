'use client';

import { SessionProvider } from '@/lib/session-context';

export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-svh overflow-hidden bg-background">
        <main className="flex min-h-svh w-full flex-col">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
