"""
config.py
=========
Centralized application configuration using Pydantic Settings.

Loads settings from environment variables or a .env file.
Supports two database modes (SQLite for dev, PostgreSQL for prod)
and two fraud detection modes (RULE_BASED / ML).

Usage:
    from config import get_settings
    settings = get_settings()
"""

import os
from enum import Enum
from functools import lru_cache
from pydantic_settings import BaseSettings


class FraudDetectionMode(str, Enum):
    """Fraud detection strategy selector."""
    RULE_BASED = "RULE_BASED"
    ML = "ML"


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Attributes:
        APP_NAME: Display name for the service.
        APP_VERSION: Semantic version string.
        DEBUG: Enable debug mode (verbose logging, auto-reload).
        HOST: Server bind address.
        PORT: Server bind port.

        DATABASE_URL: SQLAlchemy-compatible connection string.
                      Defaults to local SQLite for standalone testing.
        DB_ECHO: Echo all SQL statements (useful for debugging).

        FRAUD_DETECTION_MODE: Switch between RULE_BASED and ML scoring.
        ML_MODEL_PATH: Path to the trained fraud model pickle file.

        CORS_ORIGINS: Comma-separated list of allowed CORS origins.
                      Defaults to localhost ports for React and Spring Boot.

        DATA_DIR: Directory containing sample CSV datasets.
        UPLOAD_DIR: Directory for uploaded CSV files during ETL.
    """

    # ── App Metadata ───────────────────────────────────────────────
    APP_NAME: str = "InsuranceIQ Intelligence Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ── Database ───────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./insuranceiq.db"
    DB_ECHO: bool = False

    # ── Fraud Detection ───────────────────────────────────────────
    FRAUD_DETECTION_MODE: FraudDetectionMode = FraudDetectionMode.RULE_BASED
    ML_MODEL_PATH: str = "ml/fraud_model.pkl"

    # ── CORS (for React frontend & Spring Boot backend) ───────────
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8080,http://localhost:5173"

    # ── File Paths ────────────────────────────────────────────────
    DATA_DIR: str = "data/sample"
    UPLOAD_DIR: str = "data/uploads"

    # ── External Services ─────────────────────────────────────────
    NOTIFICATION_SERVICE_URL: str = "http://localhost:5001"
    SERVICE_SECRET: str = "InsuranceIQInternalServiceSecret2024"
    SPRING_BOOT_URL: str = "http://localhost:8080"

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def is_sqlite(self) -> bool:
        """Check if using SQLite (for conditional logic like connect_args)."""
        return self.DATABASE_URL.startswith("sqlite")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings singleton.

    Returns the same Settings instance on every call to avoid
    re-reading the .env file repeatedly.
    """
    return Settings()
