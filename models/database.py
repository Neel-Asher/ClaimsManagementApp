"""
models/database.py
==================
SQLAlchemy ORM models and database session management.

Provides:
    - Database engine and session factory (configurable via env vars)
    - ORM models for fraud predictions and processed claims
    - Dependency injection helper for FastAPI routes

The database stores:
    - Fraud prediction audit trail (every prediction is logged)
    - Processed claim data (output of ETL pipeline)
    - Cached analytics results (for fast dashboard loading)
"""

from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker

from config import get_settings

# ── Engine & Session Setup ─────────────────────────────────────
settings = get_settings()

# SQLite requires 'check_same_thread=False' for FastAPI's async usage
_connect_args = {"check_same_thread": False} if settings.is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ═══════════════════════════════════════════════════════════════
#  ORM MODELS
# ═══════════════════════════════════════════════════════════════


class FraudPredictionRecord(Base):
    """
    Audit log for every fraud prediction made by the service.

    One row is inserted each time POST /predict/fraud/{claim_id} is called.
    This allows claims managers to review prediction history and provides
    an audit trail for compliance.
    """
    __tablename__ = "fraud_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(String(50), unique=True, nullable=False, index=True)
    claim_id = Column(String(50), nullable=False, index=True)

    # ── Input Features ─────────────────────────────────────────
    claim_amount = Column(Float, nullable=False)
    days_since_policy_start = Column(Integer, nullable=False)
    claim_type = Column(String(50), nullable=False)
    previous_claims_count = Column(Integer, nullable=False)
    customer_age = Column(Integer, nullable=False)
    policy_premium_ratio = Column(Float, nullable=True)
    surveyor_mismatch_flag = Column(Integer, default=0)

    # ── Prediction Output ──────────────────────────────────────
    fraud_probability = Column(Float, nullable=False)
    risk_status = Column(String(100), nullable=False)
    recommendation = Column(Text, nullable=False)
    detection_mode = Column(String(20), nullable=False)

    # ── Metadata ───────────────────────────────────────────────
    generated_at = Column(DateTime, default=datetime.utcnow)


class ProcessedClaim(Base):
    """
    Claims data after ETL processing.

    Raw CSV data is cleaned, transformed, and loaded into this table.
    Used by the analytics service for trend computation and reporting.
    """
    __tablename__ = "processed_claims"

    id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(String(50), unique=True, nullable=False, index=True)
    policy_id = Column(String(50), nullable=False, index=True)
    customer_id = Column(String(50), nullable=False, index=True)
    agent_id = Column(String(50), nullable=True)

    # ── Claim Details ──────────────────────────────────────────
    claim_type = Column(String(50), nullable=False)
    claim_amount = Column(Float, nullable=False)
    incident_date = Column(String(20), nullable=True)
    status = Column(String(30), nullable=False)  # pending, settled, rejected

    # ── Derived Features (computed during ETL) ─────────────────
    days_since_policy_start = Column(Integer, nullable=True)
    previous_claims_count = Column(Integer, default=0)
    customer_age = Column(Integer, nullable=True)
    policy_premium_ratio = Column(Float, nullable=True)
    surveyor_mismatch_flag = Column(Integer, default=0)

    # ── Fraud Scoring ──────────────────────────────────────────
    fraud_score = Column(Float, nullable=True)
    risk_status = Column(String(100), nullable=True)

    # ── Metadata ───────────────────────────────────────────────
    processed_at = Column(DateTime, default=datetime.utcnow)


class ProcessedPolicy(Base):
    """
    Policy data after ETL processing.

    Used for analytics: renewal rates, premium collection, loss ratios.
    """
    __tablename__ = "processed_policies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    policy_id = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(String(50), nullable=False, index=True)
    agent_id = Column(String(50), nullable=True)
    product_type = Column(String(50), nullable=False)

    # ── Policy Details ─────────────────────────────────────────
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    premium_amount = Column(Float, nullable=False)
    status = Column(String(30), nullable=False)  # active, lapsed, renewed, expired

    # ── Metadata ───────────────────────────────────────────────
    processed_at = Column(DateTime, default=datetime.utcnow)


class ProcessedAgent(Base):
    """
    Agent performance data after ETL processing.

    Used for analytics: top agents, commission tracking, regional performance.
    """
    __tablename__ = "processed_agents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String(50), unique=True, nullable=False, index=True)
    agent_name = Column(String(100), nullable=False)
    region = Column(String(50), nullable=False)

    # ── Performance Metrics ────────────────────────────────────
    total_premium_collected = Column(Float, default=0.0)
    policies_sold = Column(Integer, default=0)
    claims_filed = Column(Integer, default=0)
    commission_pct = Column(Float, default=0.0)

    # ── Metadata ───────────────────────────────────────────────
    processed_at = Column(DateTime, default=datetime.utcnow)


# ═══════════════════════════════════════════════════════════════
#  DATABASE UTILITIES
# ═══════════════════════════════════════════════════════════════


def create_tables():
    """Create all database tables if they don't exist."""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all database tables (use with caution — for testing only)."""
    Base.metadata.drop_all(bind=engine)


def get_db():
    """
    FastAPI dependency that provides a database session.

    Usage in routers:
        @router.post("/endpoint")
        def my_endpoint(db: Session = Depends(get_db)):
            ...

    The session is automatically closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
