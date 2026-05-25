from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_DIR.parent

# Prefer backend/.env first for backend runtime consistency.
# Fall back to project root .env for legacy/local setups.
ENV_FILES = []
backend_env = BACKEND_DIR / ".env"
root_env = PROJECT_ROOT / ".env"

if backend_env.exists():
    ENV_FILES.append(str(backend_env))
if root_env.exists():
    ENV_FILES.append(str(root_env))


class Settings(BaseSettings):
    """Application settings for PolicyGPT Bharat"""

    # API
    api_title: str = "PolicyGPT Bharat API"
    api_version: str = "2.0.0"
    debug: bool = True
    backend_url: str = "http://localhost:8000"
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000", "*"]

    # LLM (optional — system works without it using rule-based agents)
    openai_api_key: Optional[str] = None
    llm_model: str = "gpt-3.5-turbo"

    # Google Gemini
    google_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.0-flash"

    # Groq
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.3-70b-versatile"

    # HuggingFace
    hf_token: Optional[str] = None

    # Firebase
    firebase_credentials_path: Optional[str] = None
    firebase_credentials_json: Optional[str] = None

    # ChromaDB (migration from FAISS)
    chroma_persist_dir: str = "data/chroma_db"
    chroma_collection_name: str = "bharat_policies"

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "policygpt_bharat"
    mongodb_timeout: int = 10000  # milliseconds

    class Config:
        env_file = tuple(ENV_FILES)
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
