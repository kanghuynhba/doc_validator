'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/session-context';
import { deleteDocument, getHistory, uploadPdf } from '@/lib/api';
import type { HistoryEntry } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  BarChart3,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';

export function UploadSection() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState('5');

  const {
    documentList,
    setDocumentList,
    setSessionData,
    setCurrentTab,
    setError,
    setSummary,
    goToAnalytics,
  } = useSession();

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    try {
      const history = await getHistory();
      setDocumentList(history);
    } catch (err) {
      setError(`Failed to load uploaded documents: ${(err as Error).message}`);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [setDocumentList, setError]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.');
      return;
    }

    const questions = parseInt(numQuestions, 10);
    if (Number.isNaN(questions) || questions < 1 || questions > 20) {
      setError('Please enter a question count between 1 and 20.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadPdf(file, questions);
      await loadDocuments();
      setSessionData({
        session_id: response.session_id,
        file_name: response.file_name,
        created_at: new Date().toISOString(),
        num_questions: questions,
      });
      setSummary(response.summary);
      setError(null);
      setCurrentTab('summary');
      router.push('/workspace');
    } catch (err) {
      setError(`Upload failed: ${(err as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const openDocument = (document: HistoryEntry) => {
    setSessionData({
      session_id: document.session_id,
      file_name: document.file_name,
      created_at: document.created_at,
      num_questions: document.num_questions ?? 0,
    });
    setSummary(null);
    setError(null);
    setCurrentTab('summary');
    router.push('/workspace');
  };

  const removeDocument = async (document: HistoryEntry) => {
    const confirmed = window.confirm(`Remove "${document.file_name}" from the database?`);
    if (!confirmed) return;

    setDeletingSessionId(document.session_id);
    setError(null);
    try {
      await deleteDocument(document.session_id);
      setDocumentList(documentList.filter((item) => item.session_id !== document.session_id));
    } catch (err) {
      setError(`Failed to remove document: ${(err as Error).message}`);
    } finally {
      setDeletingSessionId(null);
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border/70 bg-layout-header px-4 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="space-y-1">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Upload a PDF, reopen processed documents, and continue your review workflow.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            goToAnalytics();
            router.push('/analysis');
          }}
          variant="outline"
          className="w-fit"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Analytics
        </Button>
      </header>

      <section className="grid gap-6 px-4 pb-6 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
          <div className="border-b border-border/70 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  Upload document
                </h2>
                <p className="text-sm text-muted-foreground">PDF only</p>
              </div>
              <Badge variant="outline" className="px-2.5 py-1">
                1-20 questions
              </Badge>
            </div>
          </div>

          <div className="p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleChange}
              disabled={isUploading}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-disabled={isUploading}
              className={cn(
                'group relative flex w-full flex-col items-start justify-center gap-5 overflow-hidden rounded-lg border border-dashed px-5 py-12 text-left transition',
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border/80 bg-muted/20 hover:border-primary/40 hover:bg-muted/40',
                isUploading && 'cursor-not-allowed opacity-80'
              )}
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-md bg-background ring-1 ring-border">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Upload className="h-5 w-5 text-primary" />
                )}
              </div>

              <div className="relative space-y-1">
                <p className="text-base font-semibold text-foreground">
                  {dragActive ? 'Release to upload' : 'Drop a PDF to get started'}
                </p>
              </div>

              <div className="relative">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  size="sm"
                  className="px-4"
                >
                  {isUploading ? 'Uploading...' : 'Choose PDF'}
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Number of quiz questions
                </label>
                <p className="text-sm text-muted-foreground">
                  Choose a compact quiz for quick review or a larger set for deeper recall.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  disabled={isUploading}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">questions</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
          <div className="border-b border-border/70 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  Already uploaded
                </h2>
                <p className="text-sm text-muted-foreground">Recent processed PDFs</p>
              </div>
              <Button
                type="button"
                onClick={loadDocuments}
                variant="outline"
                size="sm"
                className=""
                disabled={isLoadingDocuments}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', isLoadingDocuments && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="divide-y divide-border/70">
            {isLoadingDocuments && documentList.length === 0 ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">
                Loading uploaded documents...
              </div>
            ) : documentList.length === 0 ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">
                No uploaded documents yet.
              </div>
            ) : (
              documentList.map((document) => (
                <div
                  key={document.session_id}
                  className="flex items-center gap-3 px-5 py-4 transition hover:bg-muted/40"
                >
                  <button
                    type="button"
                    onClick={() => openDocument(document)}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <FileText className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {document.file_name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(document.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        <span>{document.num_questions ?? 0} questions</span>
                        {document.status && (
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                            {document.status}
                          </Badge>
                        )}
                      </span>
                    </span>
                  </button>
                  <Button
                    type="button"
                    onClick={() => removeDocument(document)}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    disabled={deletingSessionId === document.session_id}
                    aria-label={`Remove ${document.file_name}`}
                  >
                    {deletingSessionId === document.session_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
