"""Application configuration loaded from environment variables / .env file."""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- App ---
    PROJECT_NAME: str = "Ganesh Bhel Business Manager API"
    API_PREFIX: str = "/api"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    # --- CORS ---
    # Comma-separated list, e.g. "http://localhost:5173,http://localhost:3000"
    BACKEND_CORS_ORIGINS: str = "*"

    # --- PostgreSQL ---
    # Either provide a full DATABASE_URL, or the individual POSTGRES_* parts below.
    DATABASE_URL: str | None = None
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "ganesh_bhel_business_manager"

    # --- AI ---
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-3.5-flash"

    # --- Firebase (optional auth) ---
    FIREBASE_ENABLED: bool = False

    # --- Backups ---
    MAX_BACKUPS: int = 12

    @property
    def sqlalchemy_database_uri(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def cors_origins(self) -> List[str]:
        if self.BACKEND_CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> "Settings":
    return Settings()


settings = get_settings()
