'use client';

import { useSession } from '@/lib/session-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function WorkspaceHeader() {
  const { sessionData, clearSession } = useSession();

  if (!sessionData) {
    return null;
  }

  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              onClick={clearSession}
              variant="ghost"
              size="sm"
              className="mt-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {sessionData.file_name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {sessionData.num_questions} questions
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(sessionData.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
