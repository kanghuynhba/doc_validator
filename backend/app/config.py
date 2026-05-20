from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Document Validator Backend"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./doc_validator.db"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    github_endpoint: str | None = None
    github_completion_api_key: str | None = None
    generative_model_name: str | None = None
    llm_temperature: float = 0.2
    max_upload_mb: int = 20
    chunk_size: int = 10000
    chunk_overlap: int = 500
    direct_summary_char_limit: int = 30000
    max_llm_concurrency: int = 1
    summary_max_tokens: int = 900
    reduce_max_tokens: int = 1000
    quiz_max_tokens: int = 1600

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    def get_database_url(self) -> str:
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
