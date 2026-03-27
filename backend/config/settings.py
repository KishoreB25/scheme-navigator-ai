from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    api_title: str = "PolicyGPT Bharat API"
    api_version: str = "1.0.0"
    debug: bool = True
    backend_url: str = "http://localhost:8000"
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000", "*"]
    
    class Config:
        env_file = ".env"


settings = Settings()
