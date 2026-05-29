# InsuranceIQ — React Frontend
### Branch: `dev-react-frontend`

> **Insurance Intelligence Platform** — A role-based, multi-dashboard React SPA that serves as the primary user interface for the entire InsuranceIQ ecosystem. It communicates with the Spring Boot backend via REST and connects to the Node.js notification service via WebSockets.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Tech Stack & Versions](#tech-stack--versions)
4. [Folder Structure](#folder-structure)
5. [Pages & Role Access](#pages--role-access)
6. [Service Layer](#service-layer)
7. [Authentication Flow](#authentication-flow)
8. [Environment Variables](#environment-variables)
9. [Installation & Setup](#installation--setup)
10. [Running the App](#running-the-app)
11. [Docker Setup](#docker-setup)
12. [Inter-Service Communication](#inter-service-communication)
13. [Component Architecture](#component-architecture)

---

## Project Overview

The React frontend is a single-page application that provides role-aware dashboards and workflows for four user types: **Admin**, **Agent**, **Customer**, and **Claims Manager**. It integrates with:

- **Spring Boot backend** (`http://localhost:8080/api`) — all REST operations (auth, claims, policies, customers, fraud, analytics)
- **Node.js notification service** (`http://localhost:3001`) — real-time WebSocket events via Socket.IO

Key features include claims submission and workflow management, fraud report viewing, policy and customer management, analytics dashboards with charts, and a real-time notifications center.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     React SPA (Port 5173)                    │
│                                                              │
│   ┌─────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│   │  AuthContext│  │  React Router │  │  Vite Dev Server │   │
│   │  (JWT store)│  │  (role-guard) │  │  (HMR / proxy)   │   │
│   └─────────────┘  └───────────────┘  └──────────────────┘   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                    Service Layer                     │   │
│   │  api.js (Axios)  │  socketService.js (Socket.IO)     │   │
│   │  authService.js  │  dataService.js                   │   │
│   └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────┬───────────────┘
                           │ HTTP/REST         │ WebSocket
                           ▼                   ▼
              ┌────────────────────┐  ┌─────────────────────┐
              │  Spring Boot API   │  │ Node.js Notification│
              │  :8080/api         │  │ Service :3001       │
              └────────────────────┘  └─────────────────────┘
```

---

## Tech Stack & Versions

| Technology          | Version    | Purpose                                 |
|---------------------|------------|-----------------------------------------|
| React               | ^19.2.6    | UI framework                            |
| React DOM           | ^19.2.6    | DOM rendering                           |
| React Router DOM    | ^7.15.1    | Client-side routing with role guards    |
| Vite                | ^8.0.12    | Build tool and dev server               |
| @vitejs/plugin-react| ^6.0.1     | Vite React plugin (Babel/SWC)           |
| Tailwind CSS        | ^4.3.0     | Utility-first CSS styling               |
| @tailwindcss/vite   | ^4.3.0     | Tailwind Vite integration               |
| Axios               | ^1.16.1    | HTTP client for REST API calls          |
| Socket.IO Client    | ^4.8.3     | WebSocket client for real-time events   |
| Recharts            | ^3.8.1     | Chart library for analytics dashboards  |
| Lucide React        | ^1.16.0    | Icon library                            |
| ESLint              | ^10.3.0    | Linting                                 |
| Node.js (runtime)   | ≥18.x      | Required for Vite and npm               |

---

## Folder Structure

```
client/
├── Dockerfile                  # Container definition for production
├── nginx.conf                  # Nginx config for serving the built app
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration (React + Tailwind plugins)
├── eslint.config.js            # ESLint rules
├── package.json                # Dependencies and scripts
│
└── src/
    ├── main.jsx                # App bootstrap (ReactDOM.createRoot, BrowserRouter)
    ├── App.jsx                 # Root route definitions with ProtectedRoute guards
    ├── index.css               # Global Tailwind base styles
    │
    ├── assets/                 # Static images (hero.png, react.svg, vite.svg)
    │
    ├── components/
    │   ├── charts/
    │   │   └── Charts.jsx          # Recharts wrappers (line, bar, pie charts)
    │   ├── common/
    │   │   ├── DataTable.jsx       # Reusable sortable/filterable table
    │   │   ├── StatCard.jsx        # KPI metric cards for dashboards
    │   │   └── StatusBadge.jsx     # Color-coded status labels
    │   ├── layout/
    │   │   ├── DashboardLayout.jsx # Shell: sidebar + topnav + <Outlet>
    │   │   ├── ProtectedRoute.jsx  # Role-based route guard HOC
    │   │   ├── Sidebar.jsx         # Navigation sidebar (role-aware links)
    │   │   └── TopNavbar.jsx       # Header with user info and notifications
    │   └── modals/
    │       └── Modal.jsx           # Generic modal dialog wrapper
    │
    ├── context/
    │   └── AuthContext.jsx         # Global auth state (JWT, user, role)
    │
    ├── data/
    │   └── mockData.js             # Fallback mock data for offline/dev mode
    │
    ├── hooks/
    │   └── useApiData.js           # Custom hook: loading/error/data pattern
    │
    ├── pages/
    │   ├── admin/
    │   │   └── AdminDashboard.jsx      # Admin KPIs, agent overview, system stats
    │   ├── agent/
    │   │   └── AgentDashboard.jsx      # Agent portfolio, commissions, policy list
    │   ├── analytics/
    │   │   └── AnalyticsDashboard.jsx  # Charts: claims trends, fraud rates, revenue
    │   ├── auth/
    │   │   └── LoginPage.jsx           # JWT login form
    │   ├── claims/
    │   │   ├── ClaimsSubmission.jsx    # Claim filing form with document upload
    │   │   └── ClaimsWorkflow.jsx      # Claims queue, status transitions
    │   ├── customer/
    │   │   └── CustomerDashboard.jsx   # Customer's own policies and claims
    │   ├── customerMgmt/
    │   │   └── CustomerManagement.jsx  # Admin/agent customer list and KYC
    │   ├── fraud/
    │   │   └── FraudReport.jsx         # ML fraud scores and flagged claims
    │   ├── notifications/
    │   │   └── NotificationsCenter.jsx # Real-time notification inbox
    │   └── policy/
    │       └── PolicyManagement.jsx    # Policy CRUD and status management
    │
    ├── services/
    │   ├── api.js              # Axios instance with JWT interceptors
    │   ├── authService.js      # Login, logout, token management
    │   ├── dataService.js      # API call functions per domain
    │   └── socketService.js    # Socket.IO connection and event helpers
    │
    └── utils/
        └── helpers.js          # Date formatting, currency, status mappers
```

---

## Pages & Role Access

| Route              | Page                   | Allowed Roles                                  |
|--------------------|------------------------|------------------------------------------------|
| `/login`           | LoginPage              | Public                                         |
| `/admin`           | AdminDashboard         | `admin`                                        |
| `/agent`           | AgentDashboard         | `agent`                                        |
| `/customer`        | CustomerDashboard      | `customer`                                     |
| `/customers`       | CustomerManagement     | `admin`, `agent`                               |
| `/policies`        | PolicyManagement       | `admin`, `agent`                               |
| `/claims`          | ClaimsSubmission       | `admin`, `agent`, `customer`, `claims_manager` |
| `/claims-workflow` | ClaimsWorkflow         | `admin`, `claims_manager`                      |
| `/fraud-report`    | FraudReport            | `admin`, `claims_manager`                      |
| `/analytics`       | AnalyticsDashboard     | `admin`, `claims_manager`                      |
| `/notifications`   | NotificationsCenter    | All authenticated roles                        |
| `*`                | Redirect to `/login`   | —                                              |

---

## Service Layer

### `api.js` — Axios Instance
- Base URL: `VITE_SPRING_API_URL` (default: `http://localhost:8080/api`)
- Attaches `Authorization: Bearer <token>` on every request via request interceptor
- On HTTP 401 responses: clears token from localStorage and redirects to `/login`

### `socketService.js` — Socket.IO Client
- Connects to `VITE_SOCKET_URL` (default: `http://localhost:3001`)
- Passes `userId` as a connection query parameter
- Auto-reconnects up to 5 times with a 1-second delay
- Falls back to mock notification mode if the socket service is unavailable
- Exposes `connect`, `disconnect`, `on`, `off`, `emit`, and `getSocket` methods

---

## Authentication Flow

```
1. User submits credentials on /login
2. authService calls POST /api/auth/login → receives { token, user, role }
3. Token is stored in localStorage
4. AuthContext is updated with user info and role
5. ProtectedRoute checks AuthContext.user + role before rendering
6. On 401 responses, Axios interceptor clears storage and redirects to /login
7. socketService.connect(userId) is called post-login for real-time events
```

---

## Environment Variables

Create a `.env` file in the `client/` directory:

```env
# Spring Boot Backend
VITE_SPRING_API_URL=http://localhost:8080/api

# Node.js Notification Service
VITE_SOCKET_URL=http://localhost:3001
```

For cloud/production deployment, replace with EC2 instance URLs or load balancer endpoints.

---

## Installation & Setup

### Prerequisites
- Node.js **18.x or higher**
- npm **9.x or higher**

### Steps

```bash
# 1. Clone the repo and switch to the frontend branch
git clone https://github.com/Neel-Asher/ClaimsManagementApp.git
cd ClaimsManagementApp
git checkout dev-react-frontend

# 2. Navigate to the client directory
cd client

# 3. Install dependencies
npm install

# 4. Create the environment file
cp .env.example .env   # or manually create .env with the variables above
```

---

## Running the App

### Development mode (with Vite HMR)
```bash
npm run dev
```
App will be available at: `http://localhost:5173`

### Production build
```bash
npm run build
# Output goes to client/dist/
```

### Preview the production build locally
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

---

## Docker Setup

A `Dockerfile` and `nginx.conf` are included for containerized deployment.

```bash
# Build the Docker image
docker build -t insuranceiq-frontend .

# Run the container
docker run -p 80:80 insuranceiq-frontend
```

The Dockerfile builds the Vite app and serves it through Nginx on port 80.

---

## Inter-Service Communication

| Target Service             | Protocol   | Default URL               | Purpose                          |
|----------------------------|------------|---------------------------|----------------------------------|
| Spring Boot Backend        | HTTP/REST  | `http://localhost:8080/api` | Auth, claims, policies, fraud   |
| Node.js Notification Svc   | WebSocket  | `http://localhost:3001`    | Real-time push notifications     |

The frontend does **not** call the Python ML service directly — all ML/fraud requests are proxied through Spring Boot.

---

## Component Architecture

```
App.jsx
└── BrowserRouter
    ├── /login → LoginPage
    └── ProtectedRoute (any authenticated role)
        └── DashboardLayout
            ├── Sidebar (role-aware navigation links)
            ├── TopNavbar (user info, notification badge)
            └── <Outlet> (rendered page)
                ├── AdminDashboard
                │   └── StatCard, Charts, DataTable
                ├── AgentDashboard
                │   └── StatCard, DataTable
                ├── ClaimsSubmission
                │   └── Modal (document upload)
                ├── ClaimsWorkflow
                │   └── DataTable, StatusBadge
                ├── FraudReport
                │   └── Charts, StatusBadge
                ├── AnalyticsDashboard
                │   └── Charts (Recharts)
                └── NotificationsCenter
                    └── (Socket.IO event listener)
```
┌──────────────────────────────────────────────────────────────┐
│          Python FastAPI Service (Port 8000)                  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                    Routers                            │   │
│  │  fraud_router.py │ etl_router.py │ analytics_router   │   │
│  └───────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                    Services                           │   │
│  │  fraud_detection.py │ etl_service.py │ analytics_svc  │   │
│  └───────────────────────────────────────────────────────┘   │
│              │                                               │
│  ┌────────────────────┐   ┌───────────────────────────────┐  │
│  │  ml/ (predictor)   │   │  models/ (DB, Schemas)        │  │
│  │  train_model.py    │   │  SQLAlchemy + SQLite/Postgres │  │
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

| Setting               | Default                         | Description                            |
|-----------------------|---------------------------------|----------------------------------------|
| `APP_NAME`            | InsuranceIQ Intelligence Service| Service display name                   |
| `APP_VERSION`         | 1.0.0                           | Semantic version                       |
| `DEBUG`               | True                            | Enable debug logging and auto-reload   |
| `HOST`                | 0.0.0.0                         | Server bind address                    |
| `PORT`                | 8000                            | Server bind port                       |
| `DATABASE_URL`        | sqlite:///./insuranceiq.db      | SQLAlchemy DB connection string        |
| `DB_ECHO`             | False                           | Log all SQL statements                 |
| `FRAUD_DETECTION_MODE`| RULE_BASED                      | `RULE_BASED` or `ML`                   |
| `ML_MODEL_PATH`       | ml/fraud_model.pkl              | Path to trained model file             |
| `CORS_ORIGINS`        | localhost:3000,8080,5173        | Comma-separated allowed origins        |
| `DATA_DIR`            | data/sample                     | Directory of sample CSVs               |
| `UPLOAD_DIR`          | data/uploads                    | Directory for ETL uploads              |

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
