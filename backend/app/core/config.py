# app/core/config.py
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    """
    Application settings loaded from environment variables.
    """
    PROJECT_NAME: str = "Multi-Tenant Chat App"
    PROJECT_VERSION: str = "1.0.0"

    # PostgreSQL (Neon) settings
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "chat_app")
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SUPER_ADMIN_USERNAME: str = os.getenv("SUPER_ADMIN_USERNAME")
    SUPER_ADMIN_PASSWORD: str = os.getenv("SUPER_ADMIN_PASSWORD")

    # MongoDB (Atlas) settings
    MONGO_DATABASE_URL: str = os.getenv("MONGO_DATABASE_URL")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "chat_app")

    # Redis settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "a_very_secret_key")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

    # API settings
    API_V1_STR: str = "/api/v1"

settings = Settings()
