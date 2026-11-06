"""
app/config/settings.py
─────────────────────────────────────────────
Purpose:
    Central configuration using Pydantic BaseSettings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # ==========================================================
    # Database
    # ==========================================================

    DATABASE_URL: str

    # ==========================================================
    # JWT Authentication
    # ==========================================================

    SECRET_KEY: str = "changeme-use-a-strong-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ==========================================================
    # OTP Configuration
    # ==========================================================

    OTP_SECRET_KEY: str = "change-this-to-a-very-long-random-secret"
    OTP_EXPIRE_MINUTES: int = 5

    # ==========================================================
    # Email Configuration
    # ==========================================================

    BREVO_API_KEY: str = ""
    BREVO_FROM_EMAIL: str = ""

    # ==========================================================
    # ML Model
    # ==========================================================

    ML_MODEL_URL: str = "http://localhost:8001/predict"
    ML_TIMEOUT_SECONDS: int = 10

    # ==========================================================
    # Application
    # ==========================================================

    APP_NAME: str = "FraudShield AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()