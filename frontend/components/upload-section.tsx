'use client';

import { useRef, useState } from 'react';
import { useSession } from '@/lib/session-context';
import { uploadPdf } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UploadSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [numQuestions, setNumQuestions] = useState('5');

  const { setSessionData, setCurrentTab, setIsLoading, setError, currentTab } =
    useSession();

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    const questions = parseInt(numQuestions, 10);
    if (isNaN(questions) || questions < 1 || questions > 20) {
      setError('Please enter a number of questions between 1 and 20');
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            PDF Summarizer & Quiz
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload a PDF to get an intelligent summary and interactive quiz
          </p>
        </div>

        {/* Upload Card */}
        <Card className="p-8">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleChange}
              disabled={isUploading}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="w-8 h-8 text-primary" />
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {dragActive ? 'Drop your PDF here' : 'Drag & drop your PDF'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Select PDF'}
              </Button>
            </div>
          </div>

          {/* Settings */}
          <div className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Number of Quiz Questions
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  disabled={isUploading}
                  className="w-24"
                />
                <p className="text-sm text-muted-foreground">
                  (1-20 questions)
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-2">Summary</h3>
            <p className="text-sm text-muted-foreground">
              Get an AI-generated summary of your PDF content
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-2">Quiz</h3>
            <p className="text-sm text-muted-foreground">
              Test your understanding with an interactive quiz
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-2">Evaluation</h3>
            <p className="text-sm text-muted-foreground">
              Rate and evaluate the AI performance
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
