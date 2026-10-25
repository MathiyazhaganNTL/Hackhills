import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Bayora AI Safety & Red-Teaming Infrastructure"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "bayora-production-security-secret-key-change-in-prod-32bytes")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours
    
    # Persistence
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./bayora.db")
    
    # Rate Limiting
    MAX_REQUESTS_PER_MINUTE_DEFAULT: int = 60
    MAX_INPUT_TOKEN_LIMIT: int = 4096
    
    # Isolation & Runtime Defaults
    ENFORCE_CONTAINER_ISOLATION: bool = os.getenv("ENFORCE_CONTAINER_ISOLATION", "false").lower() == "true"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]
    
    # Vault Integration
    VAULT_ADDR: str = os.getenv("VAULT_ADDR", "http://127.0.0.1:8200")
    VAULT_TOKEN: str = os.getenv("VAULT_TOKEN", "")

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
