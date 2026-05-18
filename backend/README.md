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

The default `DATABASE_URL` uses SQLite for local development:

```txt
sqlite:///./doc_validator.db
```

For MariaDB, set:

```txt
mysql+pymysql://user:password@localhost:3306/doc_validator
```

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

If `OPENAI_API_KEY` is set, the backend calls OpenAI through `LLMClient`.

If no key is set, it uses deterministic fallback summary and quiz generation. This keeps the pipeline testable without network access or paid API credentials.
