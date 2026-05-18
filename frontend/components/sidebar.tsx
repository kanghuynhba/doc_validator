'use client';

import { useSession } from '@/lib/session-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  FileText,
  BarChart3,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Sidebar() {
  const {
    sidebarOpen,
    documentList,
    sessionData,
    setSessionData,
    setCurrentTab,
    clearSession,
    goToAnalytics,
  } = useSession();

  const handleUploadNew = () => {
    clearSession();
  };

  const handleSelectDocument = (sessionId: string) => {
    // Find the document in the list
    const doc = documentList.find((d) => d.session_id === sessionId);
    if (doc) {
      setSessionData({
        session_id: doc.session_id,
        file_name: doc.file_name,
        created_at: doc.created_at,
        num_questions: 5, // Default, would come from API
      });
      setCurrentTab('summary');
    }
  };

  const handleAnalytics = () => {
    goToAnalytics();
  };

  if (!sidebarOpen) {
    return null;
  }

  return (
    <div className="w-64 border-r border-border bg-card h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground">LearnAI</h1>
        </div>

        <Button
          onClick={handleUploadNew}
          size="sm"
          className="w-full"
          variant={!sessionData ? 'default' : 'outline'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload PDF
        </Button>
      </div>

      {/* Documents List */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Documents
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {documentList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No documents yet. Upload your first PDF to get started.
              </p>
            ) : (
              documentList.map((doc) => (
                <button
                  key={doc.session_id}
                  onClick={() => handleSelectDocument(doc.session_id)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    sessionData?.session_id === doc.session_id
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-muted border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(doc.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Analytics Link */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleAnalytics}
          className="w-full flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Analytics</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
