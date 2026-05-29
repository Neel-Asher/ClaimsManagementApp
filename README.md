# InsuranceIQ — Python Intelligence & ML Service
### Branch: `dev-python-ml-service`

> **Insurance Intelligence Platform** — A FastAPI microservice that provides fraud detection, ETL data processing, and analytics capabilities. It is called by the Spring Boot backend and operates independently as a REST API. It supports two fraud detection modes: a rule-based heuristic engine and a trained scikit-learn ML model.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Tech Stack & Versions](#tech-stack--versions)
4. [Folder Structure](#folder-structure)
5. [API Endpoints](#api-endpoints)
6. [Fraud Detection Engine](#fraud-detection-engine)
7. [ETL Pipeline](#etl-pipeline)
8. [Analytics Service](#analytics-service)
9. [Database](#database)
10. [Configuration](#configuration)
11. [Environment Variables](#environment-variables)
12. [Installation & Setup](#installation--setup)
13. [Running the Service](#running-the-service)
14. [Training the ML Model](#training-the-ml-model)
15. [Testing](#testing)

---

## Project Overview

The Python ML service is an independent microservice that sits behind the Spring Boot backend. It is **not called directly by the React frontend**. Its responsibilities are:

- **Fraud Detection:** Score incoming claims for fraud probability using either a configurable rule-based engine or a trained RandomForest/scikit-learn model
- **ETL Processing:** Ingest CSV data exports (claims, customers, agents, policies) and load them into the local database
- **Analytics:** Provide aggregated metrics and trend data that Spring Boot can expose to the frontend

The service is built with **FastAPI** for performance and auto-generated documentation, uses **SQLAlchemy + SQLite** by default (swappable with PostgreSQL for production), and is fully **async-ready**.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│          Python FastAPI Service (Port 8000)                  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                    Routers                            │   │
│  │  fraud_router.py │ etl_router.py │ analytics_router   │   │
│  └───────────────────────────────────────────────────────┘   │
│              │                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                    Services                           │   │
│  │  fraud_detection.py │ etl_service.py │ analytics_svc  │   │
│  └───────────────────────────────────────────────────────┘   │
│              │                                               │
│  ┌────────────────────┐   ┌───────────────────────────────┐  │
│  │  ml/ (predictor)   │   │  models/ (DB, Schemas)        │  │
│  │  train_model.py    │   │  SQLAlchemy + SQLite/Postgre  │  │
│  └────────────────────┘   └───────────────────────────────┘  │
└─────────────────────────────┬────────────────────────────────┘
                              │ HTTP POST
                              ▼
                  ┌─────────────────────────┐
                  │  Spring Boot Backend    │
                  │  :8080                  │
                  └─────────────────────────┘
```

---

## Tech Stack & Versions

| Technology          | Version    | Purpose                                      |
|---------------------|------------|----------------------------------------------|
| Python              | 3.11+      | Runtime                                      |
| FastAPI             | >=0.110.0  | Async web framework and OpenAPI generation   |
| Uvicorn             | >=0.29.0   | ASGI server (with standard extras)           |
| Pydantic            | >=2.6.0    | Request/response validation and settings     |
| Pydantic-Settings   | >=2.2.0    | Environment-based configuration              |
| SQLAlchemy          | >=2.0.0    | ORM and raw SQL execution                    |
| aiosqlite           | >=0.20.0   | Async SQLite adapter                         |
| pandas              | >=2.2.0    | CSV ingestion and data transformation        |
| numpy               | >=1.26.0   | Numerical operations for ML features         |
| scikit-learn        | >=1.4.0    | ML model (RandomForest fraud classifier)     |
| joblib              | >=1.3.0    | Model serialization (save/load `.pkl`)       |
| pytest              | >=8.0.0    | Test framework                               |
| httpx               | >=0.27.0   | Async HTTP client (for integration tests)    |
| pytest-asyncio      | >=0.23.0   | Async test support                           |

---

## Folder Structure

```
(root)/
├── main.py                     # FastAPI app creation, router registration, lifespan
├── config.py                   # Settings class (Pydantic BaseSettings), env loading
├── requirements.txt            # All Python dependencies
├── insuranceiq.db              # SQLite database (dev/local — gitignored in prod)
├── .env.example                # Example environment file
│
├── ml/
│   ├── __init__.py
│   ├── train_model.py          # Model training script (produces fraud_model.pkl)
│   └── predictor.py            # Model loading and inference helpers
│
├── models/
│   ├── __init__.py
│   ├── database.py             # SQLAlchemy engine, session factory, create_tables()
│   └── schemas.py              # Pydantic schemas (request/response models, HealthResponse)
│
├── routers/
│   ├── __init__.py
│   ├── fraud_router.py         # /predict/fraud/* endpoints
│   ├── etl_router.py           # /etl/* endpoints (CSV upload and process)
│   └── analytics_router.py     # /analytics/* endpoints
│
├── services/
│   ├── __init__.py
│   ├── fraud_detection.py      # RuleBasedDetector + MLFraudDetector classes
│   ├── etl_service.py          # CSV ingestion logic and data cleaning
│   ├── analytics_service.py    # Aggregation queries for metrics
│   └── notification_client.py  # HTTP client to notify Node.js service (optional)
│
├── data/
│   └── sample/
│       ├── claims_history.csv         # Sample claims data
│       ├── customer_profiles.csv      # Sample customer data
│       ├── agent_performance.csv      # Sample agent data
│       └── policy_data.csv            # Sample policy data
│
├── scripts/
│   ├── generate_data.py        # Script to generate synthetic sample data
│   ├── seed_db.py              # Script to populate the DB from sample CSVs
│   └── test_live_server.py     # Manual smoke-test script against a running server
│
└── tests/
    ├── __init__.py
    ├── conftest.py             # pytest fixtures (test client, test DB)
    ├── test_fraud.py           # Tests for fraud prediction endpoints
    ├── test_etl.py             # Tests for ETL upload and processing
    └── test_analytics.py       # Tests for analytics endpoints
```

---

## API Endpoints

### Health
| Method | Endpoint   | Description                       |
|--------|------------|-----------------------------------|
| GET    | `/`        | Health check (status, version)    |
| GET    | `/health`  | Health check alias (load balancers)|

### Fraud Detection
| Method | Endpoint                       | Description                                      |
|--------|--------------------------------|--------------------------------------------------|
| POST   | `/predict/fraud/{claim_id}`    | Predict fraud for a given claim ID               |
| POST   | `/predict/fraud/batch`         | Batch fraud prediction for multiple claims       |
| GET    | `/predict/fraud/report`        | Get all stored fraud predictions                 |

**Sample fraud prediction request body:**
```json
{
  "claim_amount": 250000,
  "days_since_policy_start": 45,
  "claim_type": "motor_accident",
  "previous_claims_count": 2,
  "customer_age": 34,
  "policy_premium_ratio": 0.85,
  "surveyor_mismatch_flag": 1
}
```

### ETL
| Method | Endpoint              | Description                                         |
|--------|-----------------------|-----------------------------------------------------|
| POST   | `/etl/upload`         | Upload a CSV file for processing                    |
| POST   | `/etl/process`        | Process the most recently uploaded CSV              |
| GET    | `/etl/status`         | Check the status of the last ETL run                |

### Analytics
| Method | Endpoint                       | Description                              |
|--------|--------------------------------|------------------------------------------|
| GET    | `/analytics/summary`           | High-level platform KPIs                 |
| GET    | `/analytics/claims/trend`      | Claims volume over time                  |
| GET    | `/analytics/fraud/distribution`| Fraud risk distribution breakdown        |
| GET    | `/analytics/agents`            | Agent performance metrics                |

**Interactive docs (Swagger UI):** `http://localhost:8000/docs`
**ReDoc:** `http://localhost:8000/redoc`

---

## Fraud Detection Engine

The service supports two modes, switchable via the `FRAUD_DETECTION_MODE` environment variable:

### Rule-Based Mode (`FRAUD_DETECTION_MODE=RULE_BASED`)
Uses weighted heuristics based on:
- Claim amount relative to policy coverage
- Time since policy inception (early claims are higher risk)
- Number of previous claims by the same customer
- Surveyor/assessor mismatch flag

### ML Mode (`FRAUD_DETECTION_MODE=ML`)
Uses a trained `scikit-learn` classifier (RandomForest by default). Feature vector:

| Feature                   | Index | Description                                   |
|---------------------------|-------|-----------------------------------------------|
| `claim_amount`            | 0     | Claimed amount in currency units              |
| `days_since_policy_start` | 1     | Days between policy start and claim filing    |
| `claim_type`              | 2     | Encoded: motor=0, health=1, property=2, life=3|
| `previous_claims_count`   | 3     | Number of prior claims by this customer       |
| `customer_age`            | 4     | Customer age in years                         |
| `policy_premium_ratio`    | 5     | claim_amount / annual_premium                 |
| `surveyor_mismatch_flag`  | 6     | 1 if surveyor assigned ≠ expected, else 0     |

The model outputs a fraud probability (0–100%). Predictions are stored to the local DB and the result is returned to Spring Boot.

---

## ETL Pipeline

The ETL service ingests CSV files from the `/data/sample/` directory or via HTTP upload. The pipeline:

1. **Validate** the CSV schema (required columns, data types)
2. **Clean** the data (handle nulls, normalize strings, parse dates)
3. **Transform** into the internal Pydantic schemas
4. **Load** into the SQLite/PostgreSQL database via SQLAlchemy
5. **Return** a summary (records processed, errors, skipped)

Supported CSV types: `claims_history`, `customer_profiles`, `agent_performance`, `policy_data`

---

## Analytics Service

Pre-built aggregation functions include:

- **Platform summary:** total claims, open claims, fraud-flagged count, total premium collected
- **Claims trend:** daily/weekly claim volume over a configurable time window
- **Fraud distribution:** breakdown by risk level (Low / Medium / High)
- **Agent performance:** policies sold, claims handled, commission earned per agent

---

## Database

- **Default (dev):** SQLite at `./insuranceiq.db` — no setup required
- **Production:** Set `DATABASE_URL` to a PostgreSQL connection string

Tables are auto-created on startup via `create_tables()` in `models/database.py` using SQLAlchemy metadata.

---

## Configuration

All settings are in `config.py` using Pydantic `BaseSettings`. Values are loaded from environment variables or a `.env` file.

| Setting               | Default                        | Description                            |
|-----------------------|--------------------------------|----------------------------------------|
| `APP_NAME`            | InsuranceIQ Intelligence Service| Service display name                  |
| `APP_VERSION`         | 1.0.0                          | Semantic version                       |
| `DEBUG`               | True                           | Enable debug logging and auto-reload   |
| `HOST`                | 0.0.0.0                        | Server bind address                    |
| `PORT`                | 8000                           | Server bind port                       |
| `DATABASE_URL`        | sqlite:///./insuranceiq.db     | SQLAlchemy DB connection string        |
| `DB_ECHO`             | False                          | Log all SQL statements                 |
| `FRAUD_DETECTION_MODE`| RULE_BASED                     | `RULE_BASED` or `ML`                   |
| `ML_MODEL_PATH`       | ml/fraud_model.pkl             | Path to trained model file             |
| `CORS_ORIGINS`        | localhost:3000,8080,5173       | Comma-separated allowed origins        |
| `DATA_DIR`            | data/sample                    | Directory of sample CSVs               |
| `UPLOAD_DIR`          | data/uploads                   | Directory for ETL uploads              |

---

## Environment Variables

Create a `.env` file in the root directory:

```env
APP_NAME=InsuranceIQ Intelligence Service
APP_VERSION=1.0.0
DEBUG=True
HOST=0.0.0.0
PORT=8000

# Database (SQLite for dev, Postgres for prod)
DATABASE_URL=sqlite:///./insuranceiq.db

# Fraud Detection
FRAUD_DETECTION_MODE=RULE_BASED
ML_MODEL_PATH=ml/fraud_model.pkl

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:5173
```

---

## Installation & Setup

### Prerequisites
- Python 3.11 or higher
- `pip` or `pipenv`

### Steps

```bash
# 1. Clone and switch to the branch
git clone https://github.com/Neel-Asher/ClaimsManagementApp.git
cd ClaimsManagementApp
git checkout dev-python-ml-service

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment
cp .env.example .env
# Edit .env as needed

# 5. (Optional) Seed the database with sample data
python scripts/seed_db.py
```

---

## Running the Service

```bash
# Development (auto-reload on file changes)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or run via Python directly
python main.py

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Service will be available at: `http://localhost:8000`

---

## Training the ML Model

Before using `FRAUD_DETECTION_MODE=ML`, you must train and save the model:

```bash
# Generate synthetic training data (if needed)
python scripts/generate_data.py

# Train the model — outputs ml/fraud_model.pkl
python ml/train_model.py
```

The training script:
1. Loads `data/sample/claims_history.csv`
2. Engineers the 7 fraud features
3. Trains a RandomForestClassifier
4. Serializes the model to `ml/fraud_model.pkl` via joblib
5. Prints accuracy and classification report

---

## Testing

```bash
# Run all tests
pytest

# Run a specific test file
pytest tests/test_fraud.py -v

# Run with coverage
pytest --cov=. --cov-report=term-missing
```

Test coverage includes:
- Fraud prediction endpoint (rule-based and ML mode)
- ETL upload and processing
- Analytics summary and trend endpoints
- Edge cases: missing fields, invalid claim types, zero amounts
