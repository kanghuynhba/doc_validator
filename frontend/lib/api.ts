import {
  UploadResponse,
  SummaryResponse,
  QuizResponse,
  GradeResponse,
  EvaluationRatings,
  EvaluationResponse,
  AnalyticsData,
  HistoryEntry,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const CHOICE_LABELS = ['A', 'B', 'C', 'D'] as const;

type BackendUploadResponse = {
  session_id: string;
  filename: string;
  num_chunks: number;
  status: string;
};

type BackendQuizQuestion = {
  id: number;
  question: string;
  choices: Record<string, string>;
};

type BackendQuizResponse = {
  session_id: string;
  questions: BackendQuizQuestion[];
  total: number;
};

type BackendGradeItem = {
  question_id: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
};

type BackendGradeResponse = {
  score: number;
  correct: number;
  total: number;
  results: BackendGradeItem[];
};

type BackendEvaluationResponse = {
  session_id: string;
  summary_satisfaction: number;
  quiz_satisfaction: number;
  learning_outcome: number;
  llm_performance_score: number;
  performance_label: string;
};

type BackendAnalyticsResponse = Omit<AnalyticsData, 'top_performance_sessions'> & {
  label_distribution: Record<string, number>;
};

// Error handling
export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function apiCall<T>(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<T> {
  // Only use mock API if explicitly enabled
  if (USE_MOCK_API) {
    return getMockData(endpoint) as T;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        response.status,
        error.message || `API Error: ${response.statusText}`
      );
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(500, `Network error: ${(error as Error).message}`);
  }
}

// PDF Upload
export async function uploadPdf(
  file: File,
  numQuestions: number
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('num_questions', numQuestions.toString());

  const url = `${API_BASE_URL}/api/upload`;
  
  if (USE_MOCK_API) {
    return getMockData('/api/upload') as UploadResponse;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        response.status,
        error.message || `Upload failed: ${response.statusText}`
      );
    }

    const data = (await response.json()) as BackendUploadResponse;
    return {
      session_id: data.session_id,
      file_name: data.filename,
      status: data.status,
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(500, `Upload network error: ${(error as Error).message}`);
  }
}

// Get Summary
export async function getSummary(sessionId: string): Promise<SummaryResponse> {
  return apiCall<SummaryResponse>(`/api/summary/${sessionId}`);
}

// Get Quiz (without correct_answer field)
export async function getQuiz(sessionId: string): Promise<QuizResponse> {
  const data = await apiCall<BackendQuizResponse>(`/api/quiz/${sessionId}`);
  return {
    session_id: data.session_id,
    questions: data.questions.map((question) => ({
      question_id: String(question.id),
      question: question.question,
      options: CHOICE_LABELS.map((label) => question.choices[label] ?? ''),
    })),
  };
}

// Submit Quiz and Get Grades
export async function submitQuiz(
  sessionId: string,
  answers: Record<string, number>,
  questions: QuizResponse['questions']
): Promise<GradeResponse> {
  const backendAnswers = Object.fromEntries(
    Object.entries(answers).map(([questionId, optionIndex]) => [
      questionId,
      CHOICE_LABELS[optionIndex] ?? '',
    ])
  );
  const data = await apiCall<BackendGradeResponse>(
    `/api/grade/${sessionId}`,
    'POST',
    { answers: backendAnswers }
  );
  const questionById = new Map(questions.map((question) => [question.question_id, question]));

  return {
    session_id: sessionId,
    score: data.correct,
    total_questions: data.total,
    percentage: data.score,
    questions: data.results.map((result) => {
      const question = questionById.get(String(result.question_id));
      return {
        question_id: String(result.question_id),
        question: question?.question ?? `Question ${result.question_id}`,
        options: question?.options ?? [],
        user_answer: CHOICE_LABELS.indexOf(result.user_answer as typeof CHOICE_LABELS[number]),
        correct_answer: CHOICE_LABELS.indexOf(result.correct_answer as typeof CHOICE_LABELS[number]),
        is_correct: result.is_correct,
        explanation: result.explanation,
      };
    }),
  };
}

// Evaluate LLM Performance
export async function evaluateLLM(
  sessionId: string,
  ratings: EvaluationRatings
): Promise<EvaluationResponse> {
  const data = await apiCall<BackendEvaluationResponse>(
    `/api/evaluate-llm/${sessionId}`,
    'POST',
    {
      summary_rating: ratings.summary_rating,
      quiz_rating: ratings.quiz_rating,
      feedback: ratings.feedback,
    }
  );
  return {
    session_id: data.session_id,
    summary_rating: data.summary_satisfaction / 20,
    quiz_rating: data.quiz_satisfaction / 20,
    quiz_score: data.learning_outcome,
    llm_performance_score: data.llm_performance_score,
    performance_label: data.performance_label,
    feedback: ratings.feedback,
  };
}

// Get Analytics
export async function getAnalytics(): Promise<AnalyticsData> {
  const data = await apiCall<BackendAnalyticsResponse>('/api/analytics/overview');
  return {
    ...data,
    top_performance_sessions: [],
  };
}

// Get History
export async function getHistory(): Promise<HistoryEntry[]> {
  return apiCall<HistoryEntry[]>('/api/history');
}

// Mock Data (only used if NEXT_PUBLIC_USE_MOCK_API=true)
function getMockData(endpoint: string): unknown {
  const mockResponses: Record<string, unknown> = {
    '/api/upload': {
      session_id: 'mock-session-123',
      file_name: 'sample.pdf',
      status: 'processing',
    },
    '/api/session/mock-session-123/summary': {
      session_id: 'mock-session-123',
      summary: 'This is a mock summary of the PDF content. Lorem ipsum dolor sit amet.',
    },
    '/api/session/mock-session-123/quiz': {
      session_id: 'mock-session-123',
      questions: [
        {
          question_id: 'q1',
          question: 'What is the main topic of this document?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
        },
        {
          question_id: 'q2',
          question: 'Which of the following is correct?',
          options: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
        },
      ],
    },
    '/api/analytics': {
      total_sessions: 42,
      average_summary_rating: 4.2,
      average_quiz_rating: 4.1,
      average_quiz_score: 78,
      average_llm_performance_score: 85,
      top_performance_sessions: [],
    },
    '/api/history': [
      {
        session_id: 'session-1',
        file_name: 'document.pdf',
        created_at: '2024-05-15T10:30:00Z',
        summary_rating: 5,
        quiz_rating: 4,
        quiz_score: 85,
        llm_performance_score: 88,
      },
    ],
  };

  return mockResponses[endpoint] || {};
}
