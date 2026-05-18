'use client';

import { useSession } from '@/lib/session-context';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export function Navbar() {
  const { sessionData, currentTab, setCurrentTab, sidebarOpen, setSidebarOpen } =
    useSession();

  // Tabs available when a session is active
  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'result', label: 'Result / Review' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Sidebar Toggle */}
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
            size="sm"
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Tab Navigation */}
          {sessionData && (
            <nav className="flex items-center gap-2 flex-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  variant={currentTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
          )}

          {!sessionData && <div className="flex-1" />}
        </div>
      </div>
    </header>
  );
}
