'use client';

import { SessionProvider } from '@/lib/session-context';
import { UploadSection } from '@/components/upload-section';
import { Dashboard } from '@/components/dashboard';
import { useSession } from '@/lib/session-context';

function PageContent() {
  const { sessionData, currentTab } = useSession();

  // Show upload section if no session and not in analytics
  if (!sessionData && currentTab !== 'analytics') {
    return <UploadSection />;
  }

  // Show dashboard with current tab content (includes workspace and analytics)
  return <Dashboard />;
}

export default function Page() {
  return (
    <SessionProvider>
      <div className="relative min-h-svh overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_26%),linear-gradient(to_bottom,rgba(255,255,255,0.75),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_26%),linear-gradient(to_bottom,rgba(15,23,42,0.76),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <main className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <PageContent />
        </main>
      </div>
    </SessionProvider>
  );
}
