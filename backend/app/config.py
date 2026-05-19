from functools import lru_cache
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Document Validator Backend"
    api_prefix: str = "/api"
    database_url: str | None = None
    db_username: str = "root"
    db_password: str = ""
    db_host: str = "127.0.0.1"
    db_port: int = 3306
    db_name: str = "doc_validator"
    db_charset: str = "utf8mb4"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    github_endpoint: str | None = None
    github_completion_api_key: str | None = None
    generative_model_name: str | None = None
    llm_temperature: float = 0.2
    max_upload_mb: int = 20
    chunk_size: int = 1000
    chunk_overlap: int = 100

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    def get_database_url(self) -> str:
        if self.database_url:
            return self.database_url

        username = quote_plus(self.db_username)
        password = quote_plus(self.db_password)
        return (
            f"mysql+pymysql://{username}:{password}@{self.db_host}:{self.db_port}/"
            f"{self.db_name}?charset={self.db_charset}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
