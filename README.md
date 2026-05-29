# InsuranceIQ — AI-Powered Insurance Intelligence Platform
### Branch: `dev`

> A fully distributed, microservices-based enterprise insurance platform that automates policy issuance, customer onboarding, claims processing, real-time fraud detection, and push notifications. Built with React, Spring Boot, Python FastAPI, Node.js, and deployed on AWS EKS.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Repository Branch Structure](#repository-branch-structure)
4. [Complete Tech Stack](#complete-tech-stack)
5. [Service 1 — React Frontend](#service-1--react-frontend)
6. [Service 2 — Spring Boot Core API](#service-2--spring-boot-core-api)
7. [Service 3 — Python ML & Intelligence Service](#service-3--python-ml--intelligence-service)
8. [Service 4 — Node.js Notification Service](#service-4--nodejs-notification-service)
9. [Service 5 — Cloud & DevOps (EKS Deployment)](#service-5--cloud--devops-eks-deployment)
10. [Data Model & Database Schema](#data-model--database-schema)
11. [Authentication & Security](#authentication--security)
12. [Inter-Service Communication Map](#inter-service-communication-map)
13. [Testing Strategy](#testing-strategy)
14. [Local Development Setup — All Services](#local-development-setup--all-services)
15. [Environment Variables Reference](#environment-variables-reference)
16. [API Quick Reference](#api-quick-reference)

---

## Project Overview

InsuranceIQ is an AI-powered, AWS-hosted enterprise platform designed to automate and centralize the entire insurance lifecycle. The platform enables insurance companies to manage policy issuance, customer onboarding and KYC, agent performance tracking, and end-to-end claims processing — with machine learning automatically flagging fraudulent claims before settlement, and real-time WebSocket notifications keeping all stakeholders informed at every step.

The system is composed of four independently deployable microservices plus a dedicated cloud/DevOps layer, each living in its own branch of this repository.

**Core capabilities:**
- Role-based multi-dashboard SPA for Admin, Agent, Customer, and Claims Manager
- Full claims lifecycle: submission → review → fraud scoring → approval/rejection → settlement
- ML-powered fraud detection with switchable rule-based and scikit-learn modes
- Real-time push notifications via Socket.IO for claim events, KYC updates, and policy renewals
- Automated policy renewal reminders via scheduled cron jobs
- Analytics dashboards with live charts across all business dimensions
- AWS EKS deployment with Jenkins CI/CD, ECR image registry, and Prometheus/Grafana monitoring

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Public Internet / AWS NLB                           │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │   NGINX Ingress (EKS)  │
                        │   Path-based routing   │
                        └──┬─────────┬─────────┬─┘
                           │         │         │
              /            │  /api   │  /ml    │  /socket.io
              ▼            ▼         ▼         ▼
   ┌──────────────┐  ┌──────────┐  ┌────────┐  ┌────────────────┐
   │   React SPA  │  │  Spring  │  │ Python │  │ Node.js        │
   │  (Port 80)   │  │   Boot   │  │ FastAPI│  │ Socket.IO      │
   │              │  │ (Port    │  │(Port   │  │ (Port 5001)    │
   │  Vite 8      │  │  8080)   │  │ 8000)  │  │                │
   │  React 19    │  │  Java 17 │  │ Py 3.11│  │ Node 18+       │
   └──────┬───────┘  └────┬─────┘  └────────┘  └────────────────┘
          │               │              ▲               ▲
          │ REST + WS     │ REST         │ fraud predict │ trigger event
          └───────────────┤              └───────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   MySQL 8.0     │
                 │   (Port 3306)   │
                 │   AWS EBS PVC   │
                 └─────────────────┘

          ┌──────────────────────────────────┐
          │  Monitoring (separate namespace) │
          │  Prometheus → Grafana            │
          └──────────────────────────────────┘
```

**Request flow:**
1. User opens React SPA → authenticates via Spring Boot JWT
2. React calls Spring Boot REST API for all domain operations
3. Spring Boot calls Python ML service to run fraud scoring on claims
4. Spring Boot calls Node.js service to trigger push notifications
5. Node.js pushes real-time events to connected React clients over WebSocket
6. Node.js cron job sends daily policy renewal reminders independently

---

## Repository Branch Structure

| Branch                           | Contents                                              | README             |
|----------------------------------|-------------------------------------------------------|--------------------|
| `main`                           | Platform overview, architecture diagram               | (root README)      |
| `dev`                            | Integration branch — all services combined            | **This file**      |
| `dev-react-frontend`             | React 19 + Vite 8 SPA                                 | `README_dev-react-frontend.md`   |
| `dev-spring-backend`             | Spring Boot 3.2.5 Core API + MySQL                    | `README_dev-spring-backend.md`   |
| `dev-python-ml-service`          | FastAPI + scikit-learn Fraud Detection + ETL          | `README_dev-python-ml-service.md`|
| `dev-node-notifications-backend` | Node.js + Socket.IO + MySQL Notification Service      | `README_dev-node-notifications-backend.md` |
| `dev-cloud-deployment`           | Docker + EKS + Jenkins CI/CD + Prometheus/Grafana     | `README_dev-cloud-deployment.md` |

---

## Complete Tech Stack

### Application Layer

| Service            | Technology          | Version        |
|--------------------|---------------------|----------------|
| Frontend           | React               | ^19.2.6        |
| Frontend           | Vite                | ^8.0.12        |
| Frontend           | React Router DOM    | ^7.15.1        |
| Frontend           | Tailwind CSS        | ^4.3.0         |
| Frontend           | Axios               | ^1.16.1        |
| Frontend           | Socket.IO Client    | ^4.8.3         |
| Frontend           | Recharts            | ^3.8.1         |
| Backend API        | Spring Boot         | 3.2.5          |
| Backend API        | Java                | 17             |
| Backend API        | Spring Security     | (via Boot 3)   |
| Backend API        | Spring Data JPA     | (via Boot 3)   |
| Backend API        | Hibernate           | 6.x            |
| Backend API        | JJWT                | 0.12.5         |
| Backend API        | Springdoc OpenAPI   | 2.3.0          |
| Backend API        | Lombok              | latest         |
| ML Service         | Python              | 3.11+          |
| ML Service         | FastAPI             | >=0.110.0      |
| ML Service         | Uvicorn             | >=0.29.0       |
| ML Service         | scikit-learn        | >=1.4.0        |
| ML Service         | pandas              | >=2.2.0        |
| ML Service         | SQLAlchemy          | >=2.0.0        |
| ML Service         | Pydantic            | >=2.6.0        |
| Notification Svc   | Node.js             | ≥18.x          |
| Notification Svc   | Express             | ^4.19.2        |
| Notification Svc   | Socket.IO           | ^4.7.5         |
| Notification Svc   | mysql2              | ^3.10.0        |
| Notification Svc   | jsonwebtoken        | ^9.0.2         |
| Notification Svc   | node-cron           | ^3.0.3         |

### Data & Infrastructure

| Layer              | Technology                   | Version / Notes    |
|--------------------|------------------------------|--------------------|
| Primary DB         | MySQL                        | 8.0                |
| ML DB (dev)        | SQLite                       | (via aiosqlite)    |
| ML DB (prod)       | MySQL / PostgreSQL            | via pymysql        |
| Containers         | Docker                       | Latest             |
| Orchestration      | AWS EKS (Kubernetes)         | v1.34              |
| EKS Provisioning   | eksctl                       | Latest             |
| Image Registry     | AWS ECR                      | —                  |
| Ingress            | NGINX Ingress Controller     | via Helm           |
| Load Balancer      | AWS NLB                      | Auto-provisioned   |
| Storage            | AWS EBS CSI Driver           | gp2 StorageClass   |
| CI/CD              | Jenkins (Groovy Jenkinsfile) | Latest             |
| Monitoring         | Prometheus + Grafana         | kube-prometheus-stack |

---

## Service 1 — React Frontend

**Branch:** `dev-react-frontend` | **Port:** 5173 (dev) / 80 (prod)

### What it does
A role-aware single-page application that serves as the primary UI for all four user types. Communicates with Spring Boot via REST and with the Node.js service via WebSocket for real-time notifications.

### Key Pages & Role Access

| Route              | Page                    | Roles Allowed                              |
|--------------------|-------------------------|--------------------------------------------|
| `/login`           | Login                   | Public                                     |
| `/admin`           | Admin Dashboard         | `admin`                                    |
| `/agent`           | Agent Dashboard         | `agent`                                    |
| `/customer`        | Customer Dashboard      | `customer`                                 |
| `/customers`       | Customer Management     | `admin`, `agent`                           |
| `/policies`        | Policy Management       | `admin`, `agent`                           |
| `/claims`          | Claims Submission       | All authenticated                          |
| `/claims-workflow` | Claims Workflow         | `admin`, `claims_manager`                  |
| `/fraud-report`    | Fraud Report            | `admin`, `claims_manager`                  |
| `/analytics`       | Analytics Dashboard     | `admin`, `claims_manager`                  |
| `/notifications`   | Notifications Center    | All authenticated                          |

### Architecture

```
client/src/
├── App.jsx                     # Route definitions with role-guard wrappers
├── context/AuthContext.jsx     # Global JWT + user state
├── services/
│   ├── api.js                  # Axios: JWT interceptor + 401 auto-logout
│   └── socketService.js        # Socket.IO: connect, rooms, reconnect, fallback
├── components/
│   ├── layout/                 # DashboardLayout, Sidebar, TopNavbar, ProtectedRoute
│   ├── common/                 # DataTable, StatCard, StatusBadge
│   ├── charts/Charts.jsx       # Recharts wrappers
│   └── modals/Modal.jsx
└── pages/                      # One folder per domain
    ├── admin / agent / customer / auth
    ├── claims / customerMgmt / policy
    ├── fraud / analytics / notifications
```

### Quick Start

```bash
cd client
npm install
cp .env.example .env    # set VITE_SPRING_API_URL and VITE_SOCKET_URL
npm run dev             # http://localhost:5173
```

---

## Service 2 — Spring Boot Core API

**Branch:** `dev-spring-backend` | **Port:** 8080

### What it does
The central REST API that handles all business logic, authentication, database persistence, and coordination between the other services. All frontend requests route through here.

### Package Structure

```
com.insuranceiq/
├── controller/     # REST endpoints (Auth, Agent, Claim, Customer, Fraud, Policy, Product, Analytics, FileUpload)
├── service/        # Business logic (one per domain + NotificationService + FraudService)
├── model/          # JPA entities (User, Agent, Customer, Policy, Claim, ClaimDocument, Payment, FraudPrediction, InsuranceProduct)
├── model/enums/    # ClaimStatus, KycStatus, PaymentStatus, PaymentType, PolicyStatus, ProductType, Role
├── dto/            # Request/response objects (LoginRequest, AuthResponse, ClaimRequest/Response, etc.)
├── repository/     # Spring Data JPA interfaces
├── security/       # JwtUtil, JwtFilter, SecurityConfig, UserDetailsServiceImpl
└── exception/      # GlobalExceptionHandler, ResourceNotFoundException, BadRequestException, UnauthorizedException
```

### Key Configuration (`application.properties`)

```properties
server.port=8080
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:mysql://localhost:3306/insuranceiq_db...}
app.jwt.secret=${APP_JWT_SECRET:...}
app.jwt.expiration-ms=86400000
app.fraud-service.url=${APP_FRAUD_SERVICE_URL:http://localhost:8000}
app.notification-service.url=${APP_NOTIFICATION_SERVICE_URL:http://localhost:5001}
```

### Quick Start

```bash
# MySQL must be running with database 'insuranceiq_db'
cd server
mvn spring-boot:run    # http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

---

## Service 3 — Python ML & Intelligence Service

**Branch:** `dev-python-ml-service` | **Port:** 8000

### What it does
An independent FastAPI microservice called exclusively by Spring Boot (not the frontend). It provides three capabilities: ML fraud prediction, CSV/ETL data ingestion, and analytics aggregation.

### Fraud Detection Modes

**Rule-Based** (`FRAUD_DETECTION_MODE=RULE_BASED`): weighted heuristics on claim amount, policy age, claim frequency, and surveyor flags.

**ML Mode** (`FRAUD_DETECTION_MODE=ML`): trained RandomForest classifier using 7 features:

| Feature                   | Description                                      |
|---------------------------|--------------------------------------------------|
| `claim_amount`            | Claimed value                                    |
| `days_since_policy_start` | Policy age at time of claim                      |
| `claim_type`              | Encoded: motor=0, health=1, property=2, life=3   |
| `previous_claims_count`   | Prior claims by this customer                    |
| `customer_age`            | Customer age in years                            |
| `policy_premium_ratio`    | claim_amount / annual_premium                    |
| `surveyor_mismatch_flag`  | 1 if surveyor assignment is anomalous            |

### Key Endpoints

| Endpoint                         | Description                                 |
|----------------------------------|---------------------------------------------|
| `GET /`                          | Health check                                |
| `POST /predict/fraud/{claim_id}` | Predict fraud probability for a claim       |
| `POST /etl/upload`               | Upload CSV for ingestion                    |
| `GET /analytics/summary`         | Platform KPI aggregates                     |
| `GET /analytics/claims/trend`    | Claims volume over time                     |

### Quick Start

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/seed_db.py       # optional: seed sample data
uvicorn main:app --reload --port 8000
# Docs: http://localhost:8000/docs
```

### Train the ML Model

```bash
python scripts/generate_data.py   # generate synthetic training data
python ml/train_model.py          # outputs ml/fraud_model.pkl
# Then set FRAUD_DETECTION_MODE=ML in .env
```

---

## Service 4 — Node.js Notification Service

**Branch:** `dev-node-notifications-backend` | **Port:** 5001

### What it does
Manages all real-time push notifications for the platform. Spring Boot triggers events via HTTP POST, and this service delivers them to connected React clients over WebSocket. Also runs a daily cron job for policy renewal reminders.

### Socket.IO Room Architecture

```
On connect (JWT validated):
  → user_<userId>   (personal notifications)
  → role_<ROLE>     (broadcast to all admins, agents, etc.)

Emitter functions:
  emitToUser(userId, eventType, payload)  → targets user_<userId>
  emitToRole(role, eventType, payload)    → targets role_<ROLE>
```

### Notification Payload

```json
{
  "id": 123,
  "type": "CLAIM_APPROVED",
  "title": "Your claim has been approved",
  "message": "Claim #CLM-2024-001 has been approved for ₹50,000.",
  "read": false,
  "createdAt": "2024-11-15T10:30:00Z"
}
```

### Cron Jobs

| Job                     | Schedule | Description                                        |
|-------------------------|----------|----------------------------------------------------|
| Policy Renewal Reminder | Daily    | Scans for policies expiring in 30 days → push alerts |

### REST Endpoints

| Method | Endpoint                  | Description                                   |
|--------|---------------------------|-----------------------------------------------|
| GET    | `/health`                 | Health check                                  |
| POST   | `/events/trigger`         | Spring Boot triggers a notification event     |
| GET    | `/notifications`          | Fetch inbox for authenticated user            |
| PATCH  | `/notifications/:id/read` | Mark notification as read                     |

### Quick Start

```bash
cd notification-service
npm install
cp .env.example .env    # set DB credentials + JWT_SECRET (must match Spring Boot)
mysql -u root -p insuranceiq_notifications < schema.sql
npm run dev             # http://localhost:5001
```

---

## Service 5 — Cloud & DevOps (EKS Deployment)

**Branch:** `dev-cloud-deployment`

### What it does
Containerizes all four services and orchestrates them on AWS EKS. Uses Jenkins for automated CI/CD, AWS ECR for image storage, and Prometheus/Grafana for observability.

### Dockerfiles Summary

| Service         | Base Image                         | Build Type    | Exposed Port |
|-----------------|------------------------------------|---------------|--------------|
| React Frontend  | node:20-alpine → nginx:alpine      | Multi-stage   | 80           |
| Spring Boot     | maven:3.9.6-temurin-17 → jre-alpine | Multi-stage  | 8080         |
| Python ML       | python:3.11-slim                   | Single-stage  | 8000         |
| Node.js         | node:20-alpine                     | Single-stage  | 5001         |

### Jenkins CI/CD Pipeline

```
Checkout → Build All → Test All → Docker Build → ECR Push → Deploy to EKS
```

### EKS Kubernetes Resources

| Resource            | Kind         | Description                             |
|---------------------|--------------|-----------------------------------------|
| namespace           | Namespace    | `insuranceiq`                           |
| frontend-deployment | Deployment   | React (2 replicas)                      |
| backend-deployment  | Deployment   | Spring Boot (2 replicas)                |
| ml-deployment       | Deployment   | Python FastAPI (1 replica)              |
| notification-deploy | Deployment   | Node.js (1 replica)                     |
| mysql-statefulset   | StatefulSet  | MySQL with 10Gi EBS PVC                 |
| insuranceiq-ingress | Ingress      | NGINX routing: `/`, `/api`, `/ml`, `/socket.io` |
| insuranceiq-secrets | Secret       | DB passwords, JWT secrets               |
| configmap           | ConfigMap    | Service URLs, DB config                 |

### Quick Deploy

```bash
eksctl create cluster --name insuranceiq-cluster --region us-east-1 \
  --nodegroup-name workers --node-type t3.medium --nodes 3

kubectl apply -f k8s/
kubectl get ingress -n insuranceiq    # get public NLB DNS
```

---

## Data Model & Database Schema

The Spring Boot service and the Notification Service each use their own MySQL database.

### Core Database: `insuranceiq_db`

```
users
  └── id, name, email, password_hash, role, status

agents
  └── agent_id, user_id (→users), name, license_no, region, commission_pct, policies_sold

customers
  └── customer_id, user_id (→users), name, phone, dob, address, kyc_status, agent_id (→agents)

insurance_products
  └── product_id, name, type (MOTOR|HEALTH|PROPERTY|LIFE), coverage_amount, premium_rate, term_months

policies
  └── policy_id, customer_id (→customers), agent_id (→agents), product_id (→insurance_products),
      start_date, end_date, premium_amount, status (ACTIVE|EXPIRED|CANCELLED|LAPSED), fraud_risk_score

claims
  └── claim_id, policy_id (→policies), customer_id (→customers), claim_type, incident_date,
      claim_amount, status (PENDING|APPROVED|REJECTED|SETTLED), fraud_score, description

claim_documents
  └── doc_id, claim_id (→claims), doc_type, s3_url, uploaded_at

payments
  └── payment_id, policy_id (→policies), customer_name, amount, payment_date, type, status

fraud_predictions
  └── prediction_id, claim_id (→claims), fraud_probability, risk_status, recommendation
```

### Notification Database: `insuranceiq_notifications`

```
notifications
  └── id, user_id, type, title, message, is_read, created_at

events
  └── id, event_type, payload (JSON), created_at
```

---

## Authentication & Security

All services share a single **JWT secret** and use the same token format.

### Flow

```
1. POST /api/auth/login → { token, user, role }
2. Token stored in localStorage (React)
3. All Spring Boot requests: Authorization: Bearer <token>
4. Socket.IO connections: socket.handshake.auth.token = <token>
5. Node.js REST routes: Authorization: Bearer <token>
```

### JWT Configuration

| Property             | Value                                                |
|----------------------|------------------------------------------------------|
| Algorithm            | HS256                                                |
| Expiry               | 24 hours (86,400,000 ms)                             |
| Secret env var       | `APP_JWT_SECRET` (Spring) = `JWT_SECRET` (Node.js)   |
| Claims               | `userId`, `role`, `sub` (email)                      |

### Roles & Permissions

| Role              | Access                                                       |
|-------------------|--------------------------------------------------------------|
| `admin`           | Full platform access, all dashboards, all management pages   |
| `agent`           | Customer and policy management, agent dashboard              |
| `customer`        | Own dashboard, own claims submission and tracking            |
| `claims_manager`  | Claims workflow, fraud reports, analytics                    |

---

## Inter-Service Communication Map

| Caller            | Target                | Protocol    | Endpoint                     | Trigger                       |
|-------------------|-----------------------|-------------|------------------------------|-------------------------------|
| React Frontend    | Spring Boot           | HTTP/REST   | `/api/*`                     | All user actions              |
| React Frontend    | Node.js Notification  | WebSocket   | Socket.IO on `:5001`         | On login (connect)            |
| Spring Boot       | Python ML Service     | HTTP POST   | `/predict/fraud/{claim_id}`  | Fraud check on claim          |
| Spring Boot       | Node.js Notification  | HTTP POST   | `/events/trigger`            | Claim update, KYC, renewal    |
| Node.js Cron      | Spring Boot           | HTTP GET    | `/api/policies`              | Daily renewal scan            |

---

## Testing Strategy

| Service         | Framework                        | Command        | Coverage Focus                             |
|-----------------|----------------------------------|----------------|--------------------------------------------|
| Spring Boot     | JUnit 5 + Mockito                | `mvn test`     | ClaimService, ResourceNotFoundException, notification firing |
| Python ML       | Pytest + HTTPX TestClient        | `pytest`       | Health, fraud prediction, analytics queries |
| Node.js         | Jest + Supertest                 | `npm test`     | Health, JWT 401 rejection, event endpoint, 404 |
| React           | Vitest + React Testing Library   | `npm test`     | FraudReport render, stat cards, loading/empty states |

---

## Local Development Setup — All Services

To run the full platform locally, start all four services in separate terminals.

### Prerequisites

```
Java 17+          Node.js 18+       Python 3.11+      MySQL 8.0
Maven 3.8+        npm 9+            pip / venv
```

### Step 1 — Database Setup

```bash
mysql -u root -p
CREATE DATABASE insuranceiq_db;
CREATE DATABASE insuranceiq_notifications;
exit;
```

### Step 2 — Spring Boot (Terminal 1)

```bash
git checkout dev-spring-backend
cd server
# Edit application.properties with your MySQL credentials
mvn spring-boot:run
# Runs on http://localhost:8080
```

### Step 3 — Python ML Service (Terminal 2)

```bash
git checkout dev-python-ml-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/seed_db.py
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

### Step 4 — Node.js Notification Service (Terminal 3)

```bash
git checkout dev-node-notifications-backend
cd notification-service
npm install
cp .env.example .env   # ensure JWT_SECRET matches Spring Boot's app.jwt.secret
mysql -u root -p insuranceiq_notifications < schema.sql
npm run dev
# Runs on http://localhost:5001
```

### Step 5 — React Frontend (Terminal 4)

```bash
git checkout dev-react-frontend
cd client
npm install
# Create .env:
echo "VITE_SPRING_API_URL=http://localhost:8080/api" > .env
echo "VITE_SOCKET_URL=http://localhost:3001" >> .env
npm run dev
# Runs on http://localhost:5173
```

### Service Health Check URLs

| Service                  | URL                                   |
|--------------------------|---------------------------------------|
| React Frontend           | http://localhost:5173                 |
| Spring Boot API          | http://localhost:8080/swagger-ui.html |
| Python ML Service        | http://localhost:8000/docs            |
| Node.js Notification Svc | http://localhost:5001/health          |

---

## Environment Variables Reference

### React Frontend (`client/.env`)

| Variable             | Default                       | Description                         |
|----------------------|-------------------------------|-------------------------------------|
| `VITE_SPRING_API_URL`| `http://localhost:8080/api`   | Spring Boot REST base URL           |
| `VITE_SOCKET_URL`    | `http://localhost:3001`       | Node.js WebSocket server URL        |

### Spring Boot (`application.properties` / env)

| Variable                    | Default                          | Description                      |
|-----------------------------|----------------------------------|----------------------------------|
| `SPRING_DATASOURCE_URL`     | jdbc:mysql://localhost:3306/...  | MySQL connection string          |
| `SPRING_DATASOURCE_USERNAME`| root                             | MySQL username                   |
| `SPRING_DATASOURCE_PASSWORD`| root                             | MySQL password                   |
| `APP_JWT_SECRET`            | (long default key)               | HS256 JWT secret — change in prod|
| `APP_FRAUD_SERVICE_URL`     | http://localhost:8000            | Python ML service URL            |
| `APP_NOTIFICATION_SERVICE_URL` | http://localhost:5001         | Node.js service URL              |

### Python ML Service (`.env`)

| Variable               | Default                          | Description                       |
|------------------------|----------------------------------|-----------------------------------|
| `DATABASE_URL`         | sqlite:///./insuranceiq.db       | SQLAlchemy DB URL                 |
| `FRAUD_DETECTION_MODE` | RULE_BASED                       | `RULE_BASED` or `ML`             |
| `ML_MODEL_PATH`        | ml/fraud_model.pkl               | Path to trained model             |
| `CORS_ORIGINS`         | localhost:3000,8080,5173         | Allowed origins                   |

### Node.js Notification Service (`notification-service/.env`)

| Variable         | Default   | Description                                     |
|------------------|-----------|-------------------------------------------------|
| `PORT`           | 5001      | Server port                                     |
| `DB_HOST`        | localhost | MySQL host                                      |
| `DB_NAME`        | insuranceiq_notifications | Notification database name      |
| `JWT_SECRET`     | —         | Must exactly match Spring Boot's `APP_JWT_SECRET`|
| `SPRING_BOOT_URL`| http://localhost:8080 | Spring Boot URL for cron queries      |

---

## API Quick Reference

### Authentication (Spring Boot)
```
POST /api/auth/login       { email, password } → { token, user, role }
POST /api/auth/register    { name, email, password, role }
```

### Claims
```
GET    /api/claims                  List claims
POST   /api/claims                  File new claim
GET    /api/claims/{id}             Get claim
PUT    /api/claims/{id}/status      Update status
POST   /api/files/upload/{claimId}  Upload document
```

### Policies & Customers
```
GET/POST   /api/policies        List / Create
GET/POST   /api/customers       List / Create
GET/PUT    /api/policies/{id}   Get / Update
GET/PUT    /api/customers/{id}  Get / Update
```

### Fraud (Spring Boot → Python ML)
```
POST /api/fraud/predict/{claimId}   Trigger ML prediction
GET  /api/fraud/report              All predictions
```

### Analytics
```
GET /api/analytics/dashboard    KPI summary
GET /api/analytics/claims       Trend data
```

### Python ML Service (called by Spring Boot)
```
POST /predict/fraud/{claim_id}    Fraud probability score
GET  /analytics/summary           Platform aggregates
POST /etl/upload                  CSV ingestion
```

### Node.js Notifications
```
POST   /events/trigger             Spring Boot triggers event
GET    /notifications              User inbox
PATCH  /notifications/:id/read    Mark read
WS     socket.io (port 5001)      Real-time push delivery
```
