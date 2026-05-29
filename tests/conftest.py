"""
tests/conftest.py
=================
Shared test fixtures for the InsuranceIQ test suite.

Provides:
    - In-memory SQLite database for isolated testing
    - FastAPI test client with dependency overrides
    - Sample data fixtures for fraud detection tests
    - Database session fixture with auto-cleanup

All tests use an isolated in-memory database that is created
fresh for each test function -- no state leaks between tests.
"""

import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.database import Base, get_db
from main import app


# ===================================================================
#  DATABASE FIXTURES
# ===================================================================

# Single in-memory engine shared across all tests in a session
# StaticPool ensures the same in-memory DB is reused
TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create all tables once
Base.metadata.create_all(bind=TEST_ENGINE)

TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=TEST_ENGINE,
)


@pytest.fixture(name="db_session")
def fixture_db_session():
    """
    Create a database session for a single test.

    Uses a nested transaction that is rolled back after each test
    to keep the database clean.
    """
    connection = TEST_ENGINE.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Begin a nested savepoint (for rollback after test)
    nested = connection.begin_nested()

    # If the application code calls session.commit(), restart the savepoint
    @event.listens_for(session, "after_transaction_end")
    def end_savepoint(session, transaction):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    yield session

    # Rollback everything
    session.close()
    transaction.rollback()
    connection.close()


# ===================================================================
#  FASTAPI TEST CLIENT
# ===================================================================


@pytest.fixture(name="client")
def fixture_client(db_session):
    """
    FastAPI test client with database dependency override.

    Replaces the real database session with the test session
    so all API calls use the in-memory test database.
    """
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ===================================================================
#  SAMPLE DATA FIXTURES
# ===================================================================


@pytest.fixture(name="low_risk_claim")
def fixture_low_risk_claim():
    """Sample low-risk claim (should pass easily)."""
    return {
        "claim_amount": 25000,
        "days_since_policy_start": 365,
        "claim_type": "health",
        "previous_claims_count": 0,
        "customer_age": 45,
        "policy_premium_ratio": 1.5,
        "surveyor_mismatch_flag": 0,
    }


@pytest.fixture(name="moderate_risk_claim")
def fixture_moderate_risk_claim():
    """Sample moderate-risk claim (should require document verification)."""
    return {
        "claim_amount": 120000,
        "days_since_policy_start": 90,
        "claim_type": "motor_accident",
        "previous_claims_count": 2,
        "customer_age": 28,
        "policy_premium_ratio": 3.5,
        "surveyor_mismatch_flag": 0,
    }


@pytest.fixture(name="high_risk_claim")
def fixture_high_risk_claim():
    """Sample high-risk claim (should be flagged for investigation)."""
    return {
        "claim_amount": 350000,
        "days_since_policy_start": 10,
        "claim_type": "motor_accident",
        "previous_claims_count": 5,
        "customer_age": 23,
        "policy_premium_ratio": 8.0,
        "surveyor_mismatch_flag": 1,
    }
