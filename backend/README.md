# Document Validator Backend

FastAPI backend for the pipeline:

```txt
PDF upload -> extract text -> chunk text -> summarize -> generate quiz -> grade -> rate -> evaluate LLM -> analytics
```

## Run

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Database

The backend now expects MariaDB by default. Set these values in `.env`:

```txt
DB_USERNAME=root
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=doc_validator
DB_CHARSET=utf8mb4
```

`DATABASE_URL` is optional. If it is set, it overrides the individual fields above.

Tables are created on startup by SQLAlchemy for this first version. Replace that with Alembic migrations when the schema stabilizes.

## Main Endpoints

- `GET /api/health`
- `POST /api/upload`
- `GET /api/summary/{session_id}`
- `GET /api/quiz/{session_id}`
- `POST /api/grade/{session_id}`
- `POST /api/evaluate-llm/{session_id}`
- `GET /api/analytics/overview`
- `POST /api/analytics/train/linear`
- `POST /api/analytics/train/logistic`

## LLM Behavior

If `GITHUB_COMPLETION_API_KEY` and `GITHUB_ENDPOINT` are set, the backend calls GitHub Models through the OpenAI-compatible client.

If `OPENAI_API_KEY` is set instead, the backend calls OpenAI through `LLMClient`.

If no key is set, it uses deterministic fallback summary and quiz generation. This keeps the pipeline testable without network access or paid API credentials.
