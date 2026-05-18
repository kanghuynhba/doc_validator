'use client';

import { SessionProvider } from '@/lib/session-context';
import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';
import { UploadSection } from '@/components/upload-section';
import { Dashboard } from '@/components/dashboard';
import { useSession } from '@/lib/session-context';

function PageContent() {
  const { sessionData, currentTab, sidebarOpen } = useSession();

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
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <PageContent />
        </div>
      </div>
    </SessionProvider>
  );
}
