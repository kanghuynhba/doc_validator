from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_db_and_tables
from app.logging_config import configure_logging
from app.routes import analytics, evaluation, grading, health, history, quiz, summary, upload
from app.routes.upload import shutdown_llm_client


settings = get_settings()
configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield
    await shutdown_llm_client()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(upload.router, prefix=settings.api_prefix)
app.include_router(summary.router, prefix=settings.api_prefix)
app.include_router(quiz.router, prefix=settings.api_prefix)
app.include_router(grading.router, prefix=settings.api_prefix)
app.include_router(evaluation.router, prefix=settings.api_prefix)
app.include_router(analytics.router, prefix=settings.api_prefix)
app.include_router(history.router, prefix=settings.api_prefix)
