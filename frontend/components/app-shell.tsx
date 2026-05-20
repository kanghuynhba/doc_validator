'use client';

import { useEffect } from 'react';
import { Dashboard } from '@/components/dashboard';
import { UploadSection } from '@/components/upload-section';
import { useSession } from '@/lib/session-context';

type AppShellProps = {
  routeTab?: 'analytics';
  forceDashboard?: boolean;
  forceWorkspace?: boolean;
};

export function AppShell({
  routeTab,
  forceDashboard = false,
  forceWorkspace = false,
}: AppShellProps) {
  const { sessionData, currentTab, isSessionRestored, setCurrentTab } = useSession();

  useEffect(() => {
    if (!isSessionRestored || !routeTab || currentTab === routeTab) return;
    setCurrentTab(routeTab);
  }, [currentTab, isSessionRestored, routeTab, setCurrentTab]);

  useEffect(() => {
    if (!isSessionRestored || !forceWorkspace || currentTab !== 'analytics') return;
    setCurrentTab('summary');
  }, [currentTab, forceWorkspace, isSessionRestored, setCurrentTab]);

  if (!isSessionRestored) {
    return <div className="min-h-[420px]" />;
  }

  if (forceDashboard) {
    return <UploadSection />;
  }

  if (routeTab && currentTab !== routeTab) {
    return <div className="min-h-[420px]" />;
  }

  if (!sessionData && currentTab !== 'analytics') {
    return <UploadSection />;
  }

  if (forceWorkspace && currentTab === 'analytics') {
    return <div className="min-h-[420px]" />;
  }

  return <Dashboard />;
}
