from pydantic_settings import BaseSettings
from typing import Optional


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

    # Embeddings
    embedding_model: str = "all-MiniLM-L6-v2"

    # Vector DB
    vector_db_path: str = ""  # Defaults to data/faiss_index
    data_path: str = ""  # Defaults to data/schemes_data.json

    # RAG
    top_k: int = 5
    chunk_size: int = 400
    chunk_overlap: int = 50

    # Scoring thresholds
    min_relevance_score: float = 0.3

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "policygpt_bharat"
    mongodb_timeout: int = 10000  # milliseconds

    class Config:
        env_file = (".env", "../.env")
        extra = "ignore"


settings = Settings()
