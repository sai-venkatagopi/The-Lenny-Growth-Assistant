from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
_ENV_CANDIDATES = [_PROJECT_ROOT / ".env", Path(".env"), _PROJECT_ROOT / "backend" / ".env"]
_ENV_FILES = tuple(str(p) for p in _ENV_CANDIDATES if p.exists()) or (".env",)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/lenny_growth"
    model_provider: Literal["ollama", "anthropic", "openai", "demo"] = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_embed_model: str = "nomic-embed-text"
    cloud_provider: Literal["anthropic", "openai"] = "anthropic"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-5-haiku-20241022"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    embeddings_provider: Literal["ollama", "openai", "hash"] = "ollama"
    demo_fallback_enabled: bool = True
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    rag_top_k: int = 5
    rag_min_relevance: float = 0.15
    embedding_dimension: int = 768
    llm_timeout_seconds: int = 120
    rag_timeout_seconds: int = 30
    log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
