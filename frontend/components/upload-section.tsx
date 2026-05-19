'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useSession } from '@/lib/session-context';
import { uploadPdf } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  FileCheck2,
  FileText,
  Layers3,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';

const benefits = [
  {
    title: 'Precise summary',
    description: 'Turn long PDFs into a concise, structured overview.',
    icon: FileText,
  },
  {
    title: 'Relevant quiz',
    description: 'Generate questions aligned with the document content.',
    icon: FileCheck2,
  },
  {
    title: 'Performance review',
    description: 'Rate summary quality and the usefulness of the quiz.',
    icon: BarChart3,
  },
];

const workflow = [
  'Upload a PDF',
  'Review the summary',
  'Answer the quiz',
  'Evaluate the output',
];

export function UploadSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [numQuestions, setNumQuestions] = useState('5');

  const { setSessionData, setCurrentTab, setError } = useSession();

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
      setSessionData({
        session_id: response.session_id,
        file_name: response.file_name,
        created_at: new Date().toISOString(),
        num_questions: questions,
      });
      setCurrentTab('summary');
    } catch (err) {
      setError(`Upload failed: ${(err as Error).message}`);
      console.error('[v0] Upload error:', err);
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

  return (
    <div className="grid flex-1 items-center gap-6 lg:grid-cols-[1.15fr_0.85fr] xl:gap-8">
      <section className="space-y-6">
        <div className="space-y-4">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 px-3 py-1 text-primary"
          >
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Document Intelligence Studio
          </Badge>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Upload a PDF and turn it into a clean summary, quiz, and evaluation flow.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              The app extracts the document, generates a concise summary, builds a quiz,
              and gives you a direct way to score the model output.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="border-b border-border/70 bg-gradient-to-r from-primary/8 via-background to-secondary/8 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Start here
                </p>
                <h2 className="text-xl font-semibold text-foreground">
                  Drop a PDF or browse files
                </h2>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                <Layers3 className="mr-2 h-3.5 w-3.5" />
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
                'group relative flex w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl border border-dashed px-6 py-10 text-left transition-all duration-300',
                dragActive
                  ? 'border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]'
                  : 'border-border/80 bg-muted/30 hover:border-primary/40 hover:bg-primary/5',
                isUploading && 'cursor-not-allowed opacity-80'
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_32%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border">
                {isUploading ? (
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                ) : (
                  <Upload className="h-7 w-7 text-primary" />
                )}
              </div>

              <div className="relative space-y-2 text-center">
                <p className="text-lg font-semibold text-foreground">
                  {dragActive ? 'Release to upload your PDF' : 'Drag and drop your PDF here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click anywhere in this panel to choose a file
                </p>
              </div>

              <div className="relative flex flex-wrap items-center justify-center gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  Secure upload
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  Fast processing
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  AI summary + quiz
                </Badge>
              </div>

              <div className="relative">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  size="lg"
                  className="min-w-40 rounded-full px-6"
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
                  className="w-28 rounded-xl"
                />
                <span className="text-sm text-muted-foreground">questions</span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <aside className="space-y-6">
        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="border-b border-border/70 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              What you get
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              A focused review workspace
            </h2>
          </div>

          <div className="space-y-3 p-6">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border-border/70 bg-gradient-to-br from-primary/8 via-card to-secondary/10 p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Workflow
            </p>
          </div>
          <div className="mt-5 space-y-3">
            {workflow.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/75 px-4 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-foreground">{step}</span>
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
