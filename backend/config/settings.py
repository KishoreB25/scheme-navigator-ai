from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
BACKEND_ENV = BACKEND_DIR / ".env"
ENV_FILE = str(BACKEND_ENV) if BACKEND_ENV.exists() else None


class Settings(BaseSettings):
    """Application settings for PolicyGPT Bharat"""

    # API
    api_title: str = "PolicyGPT Bharat API"
    api_version: str = "2.1.0"
    debug: bool = True
    backend_url: str = "https://scheme-navigator-ai.onrender.com"
    cors_origins: list = [
        "https://scheme-navigator-ai.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Admin
    admin_api_key: Optional[str] = None

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

    # Twilio WhatsApp (Feature 8)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_whatsapp_from: str = "whatsapp:+14155238886"  # Twilio sandbox default

    # Rate Limiting (Security)
    rate_limit_default: str = "30/minute"
    rate_limit_chat: str = "10/minute"
    rate_limit_auth: str = "5/minute"
    rate_limit_admin: str = "3/minute"

    class Config:
        env_file = ENV_FILE
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
