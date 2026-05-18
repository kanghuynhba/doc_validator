// Session Management
export interface SessionData {
  session_id: string;
  file_name: string;
  created_at: string;
  num_questions: number;
}

// Upload Response
export interface UploadResponse {
  session_id: string;
  file_name: string;
  status: string;
}

// Summary Response
export interface SummaryResponse {
  session_id: string;
  summary: string;
}

// Quiz Question (does NOT include correct_answer)
export interface QuizQuestion {
  question_id: string;
  question: string;
  options: string[];
}

// Quiz Response
export interface QuizResponse {
  session_id: string;
  questions: QuizQuestion[];
}

// User's Quiz Answers
export interface QuizAnswers {
  [questionId: string]: number; // index of selected option
}

// Graded Question (includes correct_answer after grading)
export interface GradedQuestion {
  question_id: string;
  question: string;
  options: string[];
  user_answer: number;
  correct_answer: number;
  is_correct: boolean;
  explanation: string;
}

// Grade Response (after submitting quiz)
export interface GradeResponse {
  session_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  questions: GradedQuestion[];
}

// Evaluation Ratings
export interface EvaluationRatings {
  summary_rating: number; // 1-5
  quiz_rating: number; // 1-5
  feedback: string; // optional user feedback
}

// Evaluation Result (LLM Performance Score)
export interface EvaluationResponse {
  session_id: string;
  summary_rating: number;
  quiz_rating: number;
  quiz_score: number;
  llm_performance_score: number;
  performance_label: string; // "Excellent", "Good", "Average", "Poor"
  feedback: string;
}

// Analytics Data
export interface AnalyticsData {
  total_sessions: number;
  average_summary_rating: number;
  average_quiz_rating: number;
  average_quiz_score: number;
  average_llm_performance_score: number;
  top_performance_sessions: SessionSummary[];
}

export interface SessionSummary {
  session_id: string;
  file_name: string;
  llm_performance_score: number;
  created_at: string;
}

// History Entry
export interface HistoryEntry {
  session_id: string;
  file_name: string;
  created_at: string;
  summary_rating: number;
  quiz_rating: number;
  quiz_score: number;
  llm_performance_score: number;
}

// Component Props
export interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export interface TabContentProps {
  sessionData: SessionData | null;
  isLoading?: boolean;
}
