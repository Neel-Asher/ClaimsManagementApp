# InsuranceIQ — Spring Boot Backend
### Branch: `dev-spring-backend`

> **Insurance Intelligence Platform** — The core REST API server for the InsuranceIQ platform. Built with Spring Boot 3, it handles all business logic, JWT authentication, database persistence, and orchestrates calls to the Python ML service and the Node.js notification service.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Tech Stack & Versions](#tech-stack--versions)
4. [Folder Structure](#folder-structure)
5. [Data Model & Schema](#data-model--schema)
6. [API Endpoints](#api-endpoints)
7. [Security & JWT](#security--jwt)
8. [External Service Integration](#external-service-integration)
9. [Environment & Configuration](#environment--configuration)
10. [Installation & Setup](#installation--setup)
11. [Running the App](#running-the-app)
12. [Docker Setup](#docker-setup)
13. [Swagger / OpenAPI Docs](#swagger--openapi-docs)

---

## Project Overview

The Spring Boot backend is the central hub of the InsuranceIQ platform. It:

- Exposes a **RESTful API** consumed by the React frontend
- Manages all entities: Users, Agents, Customers, Policies, Claims, Payments, Insurance Products
- Handles **JWT-based authentication** with role-based access control (Admin, Agent, Customer, Claims Manager)
- Calls the **Python FastAPI service** to retrieve ML fraud predictions
- Triggers the **Node.js notification service** to push real-time events
- Persists data to a **MySQL** database using Spring Data JPA / Hibernate
- Serves uploaded claim documents and stores them to disk (configurable for AWS S3)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Spring Boot API (Port 8080)                 │
│                                                             │
│  ┌──────────────┐  ┌───────────────────┐  ┌─────────────┐   │
│  │  Controllers │→ │  Service Layer    │→ │ Repositories│   │
│  │  (REST API)  │  │  (Business Logic) │  │ (Spring JPA)│   │
│  └──────────────┘  └───────────────────┘  └──────┬──────┘   │
│                                                  │          │
│  ┌──────────────────────────────┐                │          │
│  │  Security (JWT Filter Chain) │          MySQL :3306      │
│  └──────────────────────────────┘                │          │
│                                             insuranceiq_db  │
└─────────────────────────────────────────────────────────────┘
         │                            │
         │ HTTP POST /predict/fraud   │ HTTP POST /notify
         ▼                            ▼
┌────────────────────┐    ┌────────────────────────┐
│ Python FastAPI ML  │    │ Node.js Notification   │
│ Service :8000      │    │ Service :3001/5001     │
└────────────────────┘    └────────────────────────┘
```

---

## Tech Stack & Versions

| Technology                        | Version  | Purpose                                    |
|-----------------------------------|----------|--------------------------------------------|
| Java                              | 17       | Runtime language                           |
| Spring Boot                       | 3.2.5    | Application framework                      |
| Spring Boot Starter Web           | 3.2.5    | REST controller support (Spring MVC)       |
| Spring Boot Starter Data JPA      | 3.2.5    | ORM / Hibernate integration                |
| Spring Boot Starter Security      | 3.2.5    | Security filter chain, RBAC                |
| Spring Boot Starter Validation    | 3.2.5    | Bean validation (`@Valid`, `@NotNull`)     |
| Hibernate (via JPA)               | 6.x      | ORM layer (MySQL dialect)                  |
| MySQL Connector/J                 | latest   | JDBC driver for MySQL                      |
| JJWT (jjwt-api / impl / jackson)  | 0.12.5   | JWT generation and validation              |
| Springdoc OpenAPI (Swagger UI)    | 2.3.0    | Auto-generated API documentation           |
| Lombok                            | latest   | Boilerplate reduction (getters, builders)  |
| Maven                             | 3.x      | Build and dependency management            |

---

## Folder Structure

```
server/
├── Dockerfile                          # Container definition
├── docker-compose.yml                  # Docker Compose (app + MySQL)
├── pom.xml                             # Maven build descriptor
├── InsuranceIQ.postman_collection.json # Postman collection for API testing
│
└── src/main/java/com/insuranceiq/
    │
    ├── InsuranceIqApplication.java     # @SpringBootApplication entry point
    │
    ├── config/
    │   └── OpenApiConfig.java          # Swagger/OpenAPI bean configuration
    │
    ├── controller/                     # REST controllers (one per domain)
    │   ├── AuthController.java         # POST /api/auth/login, /register
    │   ├── AgentController.java        # CRUD for agents
    │   ├── AnalyticsController.java    # Dashboard summary, metrics
    │   ├── ClaimController.java        # Claim CRUD, status transitions
    │   ├── CustomerController.java     # Customer CRUD and KYC
    │   ├── FileUploadController.java   # Multipart document upload
    │   ├── FraudController.java        # Trigger and retrieve fraud predictions
    │   ├── PolicyController.java       # Policy CRUD and lifecycle
    │   └── ProductController.java      # Insurance product catalog
    │
    ├── dto/                            # Request/Response data transfer objects
    │   ├── LoginRequest.java           # { email, password }
    │   ├── RegisterRequest.java        # { name, email, password, role }
    │   ├── AuthResponse.java           # { token, user }
    │   ├── AgentRequest/Response.java
    │   ├── ClaimRequest/Response.java
    │   ├── CustomerRequest/Response.java
    │   ├── PolicyRequest/Response.java
    │   ├── ProductRequest/Response.java
    │   ├── FraudPredictionResponse.java
    │   ├── PaymentResponse.java
    │   ├── DashboardSummary.java
    │   └── UserDto.java
    │
    ├── model/                          # JPA entity classes
    │   ├── User.java                   # Core user (all roles)
    │   ├── Agent.java                  # Insurance agent profile
    │   ├── Customer.java               # Customer profile with KYC
    │   ├── Policy.java                 # Insurance policy
    │   ├── Claim.java                  # Insurance claim
    │   ├── ClaimDocument.java          # Attached documents for claims
    │   ├── FraudPrediction.java        # ML fraud prediction result
    │   ├── InsuranceProduct.java       # Product catalog entry
    │   ├── Payment.java                # Premium/settlement payment
    │   └── enums/
    │       ├── ClaimStatus.java        # PENDING, APPROVED, REJECTED, SETTLED
    │       ├── KycStatus.java          # PENDING, VERIFIED, REJECTED
    │       ├── PaymentStatus.java      # PENDING, COMPLETED, FAILED
    │       ├── PaymentType.java        # PREMIUM, SETTLEMENT
    │       ├── PolicyStatus.java       # ACTIVE, EXPIRED, CANCELLED, LAPSED
    │       ├── ProductType.java        # MOTOR, HEALTH, PROPERTY, LIFE
    │       └── Role.java               # ADMIN, AGENT, CUSTOMER, CLAIMS_MANAGER
    │
    ├── repository/                     # Spring Data JPA interfaces
    │   ├── UserRepository.java
    │   ├── AgentRepository.java
    │   ├── CustomerRepository.java
    │   ├── PolicyRepository.java
    │   ├── ClaimRepository.java
    │   ├── ClaimDocumentRepository.java
    │   ├── FraudPredictionRepository.java
    │   ├── InsuranceProductRepository.java
    │   └── PaymentRepository.java
    │
    ├── service/                        # Business logic layer
    │   ├── AuthService.java            # Registration, login, token issuance
    │   ├── AgentService.java
    │   ├── AnalyticsService.java       # Dashboard aggregation queries
    │   ├── ClaimService.java           # Claim CRUD + status workflows
    │   ├── CustomerService.java
    │   ├── FileStorageService.java     # Local disk / S3 file storage
    │   ├── FraudService.java           # Calls Python service, stores predictions
    │   ├── NotificationService.java    # Calls Node.js service via HTTP
    │   ├── PolicyService.java
    │   └── ProductService.java
    │
    ├── security/
    │   ├── JwtUtil.java                # JWT generation, validation, claims parsing
    │   ├── JwtFilter.java              # OncePerRequestFilter — extracts Bearer token
    │   ├── SecurityConfig.java         # HttpSecurity, CORS, stateless session, route permissions
    │   └── UserDetailsServiceImpl.java # Loads UserDetails from DB by email
    │
    ├── exception/
    │   ├── GlobalExceptionHandler.java # @ControllerAdvice — maps exceptions to HTTP codes
    │   ├── ResourceNotFoundException.java  # 404
    │   ├── BadRequestException.java        # 400
    │   └── UnauthorizedException.java      # 401
    │
    └── util/
        └── DataSeeder.java             # Seeds initial data on startup (dev mode)

src/main/resources/
    ├── application.properties          # All configuration
    └── schema.sql                      # Manual SQL schema (optional reference)
```

---

## Data Model & Schema

The platform uses **MySQL** with the following core tables:

| Table                  | Description                                             |
|------------------------|---------------------------------------------------------|
| `users`                | All platform users (admin, agent, customer, manager)    |
| `agents`               | Agent profiles linked to users                          |
| `customers`            | Customer profiles with KYC status and agent assignment  |
| `insurance_products`   | Product catalog (Motor, Health, Property, Life)         |
| `policies`             | Active insurance policies linking customers to products |
| `claims`               | Filed insurance claims with status and fraud score      |
| `claim_documents`      | Documents (PDFs, images) attached to claims             |
| `payments`             | Premium and settlement payment records                  |
| `fraud_predictions`    | ML fraud prediction results per claim                   |

Key indexes: `claims.status`, `claims.fraud_score`, `policies.customer_id`, `policies.status`, `users.email`

---

## API Endpoints

### Authentication
| Method | Endpoint               | Description                    | Auth    |
|--------|------------------------|--------------------------------|---------|
| POST   | `/api/auth/login`      | Login → returns JWT token      | Public  |
| POST   | `/api/auth/register`   | Register new user              | Public  |

### Claims
| Method | Endpoint                        | Description                    | Auth       |
|--------|---------------------------------|--------------------------------|------------|
| GET    | `/api/claims`                   | List all claims                | Protected  |
| POST   | `/api/claims`                   | File a new claim               | Protected  |
| GET    | `/api/claims/{id}`              | Get claim details              | Protected  |
| PUT    | `/api/claims/{id}/status`       | Update claim status            | Admin/Mgr  |

### Policies
| Method | Endpoint                  | Description           | Auth      |
|--------|---------------------------|-----------------------|-----------|
| GET    | `/api/policies`           | List all policies     | Protected |
| POST   | `/api/policies`           | Create policy         | Admin/Agent|
| GET    | `/api/policies/{id}`      | Get policy details    | Protected |
| PUT    | `/api/policies/{id}`      | Update policy         | Admin/Agent|

### Customers
| Method | Endpoint               | Description              | Auth         |
|--------|------------------------|--------------------------|--------------|
| GET    | `/api/customers`       | List all customers       | Admin/Agent  |
| POST   | `/api/customers`       | Create customer          | Admin/Agent  |
| PUT    | `/api/customers/{id}`  | Update customer/KYC      | Admin/Agent  |

### Fraud
| Method | Endpoint                        | Description                         | Auth     |
|--------|---------------------------------|-------------------------------------|----------|
| POST   | `/api/fraud/predict/{claimId}`  | Trigger ML fraud prediction         | Admin/Mgr|
| GET    | `/api/fraud/report`             | Get all fraud predictions           | Admin/Mgr|

### Analytics
| Method | Endpoint                    | Description               | Auth     |
|--------|-----------------------------|---------------------------|----------|
| GET    | `/api/analytics/dashboard`  | Aggregated KPI summary    | Admin/Mgr|
| GET    | `/api/analytics/claims`     | Claims trend data         | Admin/Mgr|

### File Upload
| Method | Endpoint                         | Description                   | Auth      |
|--------|----------------------------------|-------------------------------|-----------|
| POST   | `/api/files/upload/{claimId}`    | Upload claim document         | Protected |

**Full interactive docs:** `http://localhost:8080/swagger-ui.html`

---

## Security & JWT

- **Algorithm:** HS256
- **Expiry:** 24 hours (86,400,000 ms — configurable via `app.jwt.expiration-ms`)
- **Token delivery:** `Authorization: Bearer <token>` header
- **Route access** is controlled via `SecurityConfig.java` using `@PreAuthorize` and `HttpSecurity` role matchers
- The `JwtFilter` extracts and validates the token on every incoming request before it reaches a controller
- Stateless session: no `HttpSession` is created (`SessionCreationPolicy.STATELESS`)

---

## External Service Integration

### Python ML Service (`FraudService.java`)
- Called via HTTP POST to `app.fraud-service.url/predict/fraud/{claimId}`
- Returns a `FraudPredictionResponse` with `fraud_probability`, `risk_status`, and `recommendation`
- Result is persisted to the `fraud_predictions` table
- The claim's `fraud_score` field is updated accordingly

### Node.js Notification Service (`NotificationService.java`)
- Called via HTTP POST to `app.notification-service.url`
- Triggered on events: claim status change, KYC approval, policy renewal
- Passes `userId`, `eventType`, and `message` payload

---

## Environment & Configuration

All config lives in `src/main/resources/application.properties`:

```properties
# Server
server.port=8080

# MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/insuranceiq_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect

# JWT
app.jwt.secret=<your-256-bit-secret>
app.jwt.expiration-ms=86400000

# File Upload
spring.servlet.multipart.max-file-size=10MB
app.upload.dir=./uploads

# External Services
app.fraud-service.url=http://localhost:8000
app.notification-service.url=http://localhost:3001

# Swagger
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.api-docs.path=/api-docs
```

> **Production:** Override sensitive values via environment variables or a secrets manager (AWS Secrets Manager, etc.)

---

## Installation & Setup

### Prerequisites
- Java 17
- Maven 3.8+
- MySQL 8.x running locally (or via Docker)

### Steps

```bash
# 1. Clone and switch to the backend branch
git clone https://github.com/Neel-Asher/ClaimsManagementApp.git
cd ClaimsManagementApp
git checkout dev-spring-backend

# 2. Create the database in MySQL
mysql -u root -p
CREATE DATABASE insuranceiq_db;
exit;

# 3. (Optional) Run the schema manually
mysql -u root -p insuranceiq_db < server/src/main/resources/schema.sql

# 4. Update application.properties with your MySQL credentials

# 5. Build the project
cd server
mvn clean install
```

---

## Running the App

```bash
# Run via Maven
mvn spring-boot:run

# Or run the built JAR
java -jar target/insurance-iq-backend-1.0.0.jar
```

Server starts on: `http://localhost:8080`

---

## Docker Setup

```bash
# From the server/ directory
docker build -t insuranceiq-backend .

# Or use the provided Docker Compose (starts app + MySQL together)
cd server
docker-compose up --build
```

The `docker-compose.yml` spins up:
- `insuranceiq-backend` — Spring Boot app on port 8080
- `mysql` — MySQL 8 on port 3306 with `insuranceiq_db` initialized

---

## Swagger / OpenAPI Docs

Once the server is running:

- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:8080/api-docs`

A complete **Postman collection** is also included at `server/InsuranceIQ.postman_collection.json` — import it into Postman to test all endpoints.
