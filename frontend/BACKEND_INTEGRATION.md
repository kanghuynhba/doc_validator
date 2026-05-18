# PDF Summarizer & Quiz - Backend Integration Guide

This document provides instructions for integrating your backend API with the PDF Summarizer & Quiz application.

## Overview

The application follows a complete user workflow:
1. User uploads PDF
2. Backend processes PDF and returns session ID
3. User views generated summary
4. User answers interactive quiz
5. User submits quiz and sees score
6. User rates summary and quiz (1-5 stars)
7. Backend calculates LLM Performance Score
8. User views final evaluation and analytics

## API Integration

### Base URL Configuration

The application uses `NEXT_PUBLIC_API_BASE_URL` environment variable for the backend URL. 

**Set in your `.env.local`:**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Or for production:
```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### Mock API Mode

To test the frontend without a backend, set:
```
NEXT_PUBLIC_USE_MOCK_API=true
```

**Important:** The application will ONLY use mock data if this is explicitly set to `"true"`. Otherwise, it expects a real backend API and will show error messages if the backend is unavailable.

## Required API Endpoints

### 1. Upload PDF
**POST** `/api/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `file` (File): PDF file
  - `num_questions` (number): Number of quiz questions (1-20)

**Response:**
```json
{
  "session_id": "string",
  "file_name": "string",
  "status": "string"
}
```

### 2. Get Summary
**GET** `/api/session/{session_id}/summary`

**Response:**
```json
{
  "session_id": "string",
  "summary": "string (markdown or plain text)"
}
```

### 3. Get Quiz
**GET** `/api/session/{session_id}/quiz`

**Response:**
```json
{
  "session_id": "string",
  "questions": [
    {
      "question_id": "string",
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"]
    }
  ]
}
```

**Important:** The quiz response must NOT include a `correct_answer` field. Correct answers are only revealed after grading.

### 4. Submit Quiz (Grade)
**POST** `/api/session/{session_id}/grade`

**Request:**
```json
{
  "answers": {
    "question_id_1": 0,
    "question_id_2": 2,
    ...
  }
}
```

**Response:**
```json
{
  "session_id": "string",
  "score": number,
  "total_questions": number,
  "percentage": number,
  "questions": [
    {
      "question_id": "string",
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "user_answer": number,
      "correct_answer": number,
      "is_correct": boolean,
      "explanation": "string"
    }
  ]
}
```

### 5. Evaluate LLM Performance
**POST** `/api/session/{session_id}/evaluate`

**Request:**
```json
{
  "session_id": "string",
  "summary_rating": number (1-5),
  "quiz_rating": number (1-5),
  "feedback": "string (optional)"
}
```

**Response:**
```json
{
  "session_id": "string",
  "summary_rating": number,
  "quiz_rating": number,
  "quiz_score": number,
  "llm_performance_score": number,
  "performance_label": "string (Excellent/Good/Average/Poor)",
  "feedback": "string"
}
```

The `llm_performance_score` should be calculated based on:
- Summary rating (1-5 stars)
- Quiz rating (1-5 stars)
- Quiz performance (0-100%)

Example formula:
```
llm_performance_score = (summary_rating * 20) + (quiz_rating * 20) + (quiz_score * 0.6)
```

### 6. Get Analytics
**GET** `/api/analytics`

**Response:**
```json
{
  "total_sessions": number,
  "average_summary_rating": number,
  "average_quiz_rating": number,
  "average_quiz_score": number,
  "average_llm_performance_score": number,
  "top_performance_sessions": [
    {
      "session_id": "string",
      "file_name": "string",
      "llm_performance_score": number,
      "created_at": "ISO 8601 timestamp"
    }
  ]
}
```

### 7. Get History
**GET** `/api/history`

**Response:**
```json
[
  {
    "session_id": "string",
    "file_name": "string",
    "created_at": "ISO 8601 timestamp",
    "summary_rating": number,
    "quiz_rating": number,
    "quiz_score": number,
    "llm_performance_score": number
  }
]
```

## Error Handling

The application handles API errors gracefully:
- Network errors show: "Network error: [message]"
- HTTP errors show: Error status with message from backend
- 400 errors: Validation errors from backend
- 404 errors: Session or resource not found
- 500 errors: Server errors

Error messages are displayed in a dismissible alert at the top of the dashboard.

## TypeScript Types

All request/response types are defined in `lib/types.ts` with full TypeScript support. The API wrapper in `lib/api.ts` is fully typed with:
- `UploadResponse`
- `SummaryResponse`
- `QuizResponse`
- `GradeResponse`
- `EvaluationResponse`
- `AnalyticsData`
- `HistoryEntry`

## Development

### Running with Mock API
```bash
NEXT_PUBLIC_USE_MOCK_API=true pnpm dev
```

### Running with Real Backend
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 pnpm dev
```

### Testing the API Integration

1. Start the development server
2. Open http://localhost:3000
3. The upload section will be ready for PDF uploads
4. Check browser console for any API errors

## CORS Configuration

Ensure your backend allows CORS requests from the frontend origin:

```python
# Example: Python/Flask
from flask_cors import CORS
CORS(app, origins=["http://localhost:3000", "https://yourdomain.com"])
```

```javascript
// Example: Node.js/Express
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com']
}));
```

## Security Notes

- All requests use standard HTTP methods (GET, POST)
- User feedback and ratings are stored by session
- Quiz answers are submitted together, not individually
- No authentication is implemented by default - add your own auth layer if needed
- Use HTTPS in production
- Validate all file uploads on the backend
- Implement rate limiting on the backend

## Performance Considerations

- PDF processing may take time - consider implementing a polling mechanism or WebSocket for progress updates
- Large PDFs may require increased timeout values
- Cache quiz responses if the same PDF is re-uploaded
- Implement database indexing on session_id and created_at

## Testing Checklist

- [ ] Upload PDF file successfully
- [ ] View generated summary
- [ ] Answer all quiz questions
- [ ] Submit quiz and see results with explanations
- [ ] Rate summary and quiz with stars
- [ ] View LLM Performance Score
- [ ] Check analytics page
- [ ] Review session history
- [ ] Test error handling (network down, invalid file, etc.)
- [ ] Responsive design on mobile/tablet
