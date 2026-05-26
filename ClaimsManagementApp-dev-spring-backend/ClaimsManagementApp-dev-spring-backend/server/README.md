# InsuranceIQ Backend — Spring Boot

AI-Powered Insurance Policy & Claims Management Platform — Backend API

## Tech Stack

- Java 17
- Spring Boot 3.2.5
- Spring Security + JWT
- Spring Data JPA
- MySQL
- Swagger/OpenAPI (Springdoc)
- Lombok
- Maven

## Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8+

## Setup

### 1. Create MySQL Database

```sql
CREATE DATABASE insuranceiq_db;
```

### 2. Configure Database

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/insuranceiq_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
```

### 3. Build & Run

```bash
cd server
mvn clean install
mvn spring-boot:run
```

The server starts on `http://localhost:8080`

### 4. Access Swagger UI

Open: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@insuranceiq.com | password123 |
| Agent | agent@insuranceiq.com | password123 |
| Customer | customer@insuranceiq.com | password123 |
| Claims Manager | claims@insuranceiq.com | password123 |

## API Endpoints

### Authentication (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Register new user |

### Customers (Admin, Agent)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |

### Agents (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| POST | `/api/agents` | Create agent |
| PUT | `/api/agents/{id}` | Update agent |

### Insurance Products (All authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product (Admin) |
| PUT | `/api/products/{id}` | Update product (Admin) |

### Policies (Admin, Agent)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/policies` | List policies |
| POST | `/api/policies` | Create policy |
| PUT | `/api/policies/{id}` | Update policy |
| DELETE | `/api/policies/{id}` | Delete policy |

### Claims (All authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/claims` | List claims |
| POST | `/api/claims` | Submit claim |
| PUT | `/api/claims/{id}` | Update claim |
| DELETE | `/api/claims/{id}` | Delete claim |

### Fraud Prediction (Admin, Claims Manager)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict/fraud/{claimId}` | Run fraud prediction |
| GET | `/api/predict/fraud/all` | All predictions |
| GET | `/api/predict/fraud/flagged` | Flagged predictions |

### Analytics (Admin, Claims Manager)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard-summary` | Dashboard stats |
| GET | `/api/analytics/top-agents` | Top agents |
| GET | `/api/analytics/fraud-flagged-claims` | Fraud flagged |
| GET | `/api/analytics/claims-trend` | Claims trend |
| GET | `/api/analytics/loss-ratio` | Loss ratio |
| GET | `/api/analytics/renewal-rate` | Renewal rate |

### File Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload/claim/{claimId}` | Upload claim doc |

## Architecture

```
server/
├── controller/     — REST endpoints
├── service/        — Business logic
├── repository/     — JPA data access
├── model/          — JPA entities
├── dto/            — Request/Response DTOs
├── security/       — JWT auth & Spring Security
├── config/         — Swagger, CORS config
├── exception/      — Global error handling
└── util/           — Data seeder
```

## External Services

- **FastAPI ML Service**: `http://localhost:8000` (fraud prediction)
- **Socket.IO Server**: `http://localhost:3001` (notifications)
- **React Frontend**: `http://localhost:5173` (Vite dev server)

## Docker

```bash
docker build -t insuranceiq-backend .
docker run -p 8080:8080 insuranceiq-backend
```
