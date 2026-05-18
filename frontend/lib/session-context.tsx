'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { SessionData, GradeResponse, EvaluationResponse, HistoryEntry } from './types';

interface SessionContextType {
  // Current document workspace
  sessionData: SessionData | null;
  setSessionData: (data: SessionData | null) => void;
  
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  documentList: HistoryEntry[];
  setDocumentList: (list: HistoryEntry[]) => void;
  
  // Current tab in workspace
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  
  // Ratings (persisted after submission)
  summaryRating: number | null;
  setSummaryRating: (rating: number | null) => void;
  
  quizRating: number | null;
  setQuizRating: (rating: number | null) => void;
  
  feedback: string;
  setFeedback: (feedback: string) => void;
  
  // Fetched data
  summary: string | null;
  setSummary: (summary: string | null) => void;
  
  gradeResult: GradeResponse | null;
  setGradeResult: (result: GradeResponse | null) => void;
  
  evaluationResult: EvaluationResponse | null;
  setEvaluationResult: (result: EvaluationResponse | null) => void;
  
  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  error: string | null;
  setError: (error: string | null) => void;
  
  clearSession: () => void;
  goToAnalytics: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documentList, setDocumentList] = useState<HistoryEntry[]>([]);
  const [currentTab, setCurrentTab] = useState('summary');
  
  const [summaryRating, setSummaryRating] = useState<number | null>(null);
  const [quizRating, setQuizRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  
  const [summary, setSummary] = useState<string | null>(null);
  const [gradeResult, setGradeResult] = useState<GradeResponse | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResponse | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    setSessionData(null);
    setCurrentTab('summary');
    setSummary(null);
    setGradeResult(null);
    setEvaluationResult(null);
    setSummaryRating(null);
    setQuizRating(null);
    setFeedback('');
    setIsLoading(false);
    setError(null);
  }, []);

  const goToAnalytics = useCallback(() => {
    setSessionData(null);
    setCurrentTab('analytics');
  }, []);

  const value: SessionContextType = {
    sessionData,
    setSessionData,
    sidebarOpen,
    setSidebarOpen,
    documentList,
    setDocumentList,
    currentTab,
    setCurrentTab,
    summaryRating,
    setSummaryRating,
    quizRating,
    setQuizRating,
    feedback,
    setFeedback,
    summary,
    setSummary,
    gradeResult,
    setGradeResult,
    evaluationResult,
    setEvaluationResult,
    isLoading,
    setIsLoading,
    error,
    setError,
    clearSession,
    goToAnalytics,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
