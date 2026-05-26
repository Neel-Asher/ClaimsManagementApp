# 🛡️ InsuranceIQ — Notification Service

**AI Powered Insurance & Claims Management Platform**

Real-time notification module built with **NodeJS + Express + Socket.IO + MySQL**.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Database Setup](#database-setup)
- [Running the Service](#running-the-service)
- [API Documentation](#api-documentation)
- [Socket.IO Integration](#socketio-integration)
- [Frontend Examples](#frontend-examples)
- [Testing Guide](#testing-guide)

---

## ✨ Features

| Event | Triggered By | Notifies |
|-------|-------------|----------|
| `CLAIM_FILED` | Customer/Agent submits claim | Claims Manager |
| `CLAIM_STATUS_UPDATED` | Claim approved/rejected | Customer + Agent |
| `FRAUD_ALERT` | Python fraud service | Claims Manager |
| `POLICY_RENEWAL_DUE` | Scheduled cron job (daily 9 AM) | Customer + Agent |
| `PREMIUM_PAYMENT_RECEIVED` | Premium payment success | Customer |
| `CLAIM_SETTLED` | Settlement completed | Customer |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| NodeJS | Runtime |
| ExpressJS | REST API framework |
| Socket.IO | Real-time communication |
| MySQL | Notification storage |
| JWT | Authentication |
| node-cron | Scheduled jobs |
| axios | HTTP client |
| helmet | Security headers |
| cors | Cross-origin support |
| dotenv | Environment config |

---

## 📁 Project Structure

```
notification-service/
│
├── src/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── controllers/
│   │   ├── notificationController.js   # REST API handlers
│   │   └── eventController.js          # Internal event handlers
│   ├── routes/
│   │   ├── notificationRoutes.js  # Public API routes
│   │   └── eventRoutes.js         # Internal event routes
│   ├── services/
│   │   └── notificationService.js # Core business logic
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification
│   ├── sockets/
│   │   └── socketManager.js       # Socket.IO setup
│   ├── cron/
│   │   └── renewalCron.js         # Policy renewal scheduler
│   ├── utils/
│   │   └── helpers.js             # Utility functions
│   └── app.js                     # Express app configuration
│
├── server.js          # Entry point
├── package.json
├── .env               # Environment variables
├── .env.example       # Example env template
├── .gitignore
├── schema.sql         # MySQL database schema
└── README.md          # This file
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** (v16 or above)
- **MySQL** (v8 or above)
- **npm** (comes with Node.js)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-team/insuranceiq-notification-service.git
cd notification-service
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Copy the example environment file and update values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5001

DB_HOST=localhost
DB_PORT=3306
DB_NAME=insuranceiq_notifications
DB_USER=root
DB_PASSWORD=root

JWT_SECRET=insuranceiq_secret

SPRING_BOOT_URL=http://localhost:8080
```

---

## 🗄️ Database Setup

### Step 1: Open MySQL Command Line

```bash
mysql -u root -p
```

### Step 2: Run the Schema Script

```sql
source schema.sql;
```

Or run directly:

```bash
mysql -u root -p < schema.sql
```

This creates the `insuranceiq_notifications` database and the `notifications` table with sample data.

---

## ▶️ Running the Service

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server starts at: **http://localhost:5001**

You should see:

```
╔══════════════════════════════════════════════════════╗
║   InsuranceIQ — Notification Service                ║
║   AI Powered Insurance & Claims Management Platform ║
╠══════════════════════════════════════════════════════╣
║   🚀 Server running on port 5001                    ║
║   📡 Socket.IO ready                                ║
║   🗄️  MySQL connected                               ║
║   ⏰ Cron jobs scheduled                            ║
╚══════════════════════════════════════════════════════╝
```

---

## 📡 API Documentation

### Health Check

```
GET /health
```

### Notification APIs (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications/:userId` | Get notifications (paginated) |
| `PUT` | `/api/notifications/read/:notificationId` | Mark notification as read |
| `PUT` | `/api/notifications/read-all/:userId` | Mark all as read |
| `DELETE` | `/api/notifications/:notificationId` | Delete notification |
| `POST` | `/api/notifications/test` | Send test notification |

#### Query Parameters for GET

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `unread` | boolean | false | Filter unread only |

### Internal Event APIs (No JWT — Service-to-Service)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/internal/events/claim-filed` | Claim filed notification |
| `POST` | `/internal/events/claim-status-updated` | Claim status change |
| `POST` | `/internal/events/fraud-alert` | Fraud score alert |
| `POST` | `/internal/events/payment-received` | Payment received |
| `POST` | `/internal/events/claim-settled` | Claim settlement |

---

## 🔌 Socket.IO Integration

### Frontend Connection

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5001", {
  auth: {
    token: jwtToken  // JWT token from login
  }
});
```

### Socket Rooms

| Room | Format | Example |
|------|--------|---------|
| User-specific | `user_{userId}` | `user_5` |
| Role-based | `role_{ROLE}` | `role_ADMIN`, `role_AGENT`, `role_CUSTOMER` |

### Event Payload Format

```json
{
  "notificationId": 1,
  "eventType": "CLAIM_STATUS_UPDATED",
  "title": "Claim Approved",
  "message": "Your claim has been approved",
  "timestamp": "2026-05-26T10:30:00Z"
}
```

---

## 🧪 Testing Guide

### 1. Test with cURL

#### Send Test Notification

```bash
curl -X POST http://localhost:5001/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 5,
    "title": "Test Notification",
    "message": "Realtime notification working",
    "eventType": "TEST"
  }'
```

#### Trigger Claim Filed Event

```bash
curl -X POST http://localhost:5001/internal/events/claim-filed \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": 1001,
    "customerId": 5,
    "claimsManagerId": 7,
    "claimType": "Motor Accident",
    "claimAmount": 95000
  }'
```

#### Trigger Fraud Alert

```bash
curl -X POST http://localhost:5001/internal/events/fraud-alert \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": 1001,
    "fraudProbability": 82,
    "riskStatus": "HIGH_RISK",
    "claimsManagerId": 7
  }'
```

#### Trigger Claim Status Update

```bash
curl -X POST http://localhost:5001/internal/events/claim-status-updated \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": 1001,
    "customerId": 5,
    "agentId": 9,
    "status": "APPROVED",
    "remarks": "All documents verified"
  }'
```

#### Trigger Payment Received

```bash
curl -X POST http://localhost:5001/internal/events/payment-received \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 5,
    "policyId": 101,
    "amount": 12500,
    "paymentDate": "2026-05-26"
  }'
```

#### Trigger Claim Settled

```bash
curl -X POST http://localhost:5001/internal/events/claim-settled \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": 1001,
    "customerId": 5,
    "settlementAmount": 85000
  }'
```

#### Get Notifications (JWT Required)

```bash
curl -X GET "http://localhost:5001/api/notifications/5?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Mark Notification as Read

```bash
curl -X PUT http://localhost:5001/api/notifications/read/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Mark All as Read

```bash
curl -X PUT http://localhost:5001/api/notifications/read-all/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Test Socket.IO

Use the HTML test page in `examples/socket-test.html` (see below) or use a Socket.IO client extension in your browser.

---

## 🎨 Frontend Examples

See the `examples/` folder for complete React components:

- `examples/socket-test.html` — Quick Socket.IO browser test
- `examples/NotificationProvider.jsx` — React context + socket setup
- `examples/NotificationBell.jsx` — Notification bell with unread badge
- `examples/NotificationList.jsx` — Full notification list component

---

## 👥 Team

| Member | Role |
|--------|------|
| Candidate 1 | Spring Boot Backend |
| Candidate 2 | ReactJS Frontend |
| Candidate 3 | Python AI/ML Service |
| **Candidate 4** | **NodeJS Notification Service** |
| Candidate 5 | AWS Deployment + Data Engineering |

---

## 📄 License

ISC — InsuranceIQ Capstone Project
