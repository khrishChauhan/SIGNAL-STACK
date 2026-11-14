from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Signal Stack"
    PROJECT_DESCRIPTION: str = "Company Intelligence & Executive Briefing Engine"
    API_PREFIX: str = "/api"
    DEBUG: bool = True

    # Database: SQLite by default for zero-setup local dev, PostgreSQL for production
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/signal_stack.db"
    DATABASE_ECHO: bool = False

    # AI Configuration
    AI_PROVIDER: str = "ollama"  # "ollama" or "fallback"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    AI_TIMEOUT_SECONDS: int = 45
    AI_MAX_RETRIES: int = 2

    # Storage and File Ingestion
    UPLOAD_DIR: str = "./data/uploads"
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".pdf", ".docx", ".csv", ".xlsx", ".txt"]

    # CORS & Networking
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    # Crawler & Rate Limiting
    CRAWLER_USER_AGENT: str = "SignalStackBot/1.0 (+https://signalstack.internal; bot@signalstack.internal)"
    CRAWLER_TIMEOUT_SECONDS: int = 15
    CRAWLER_MIN_DELAY_SECONDS: float = 1.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
