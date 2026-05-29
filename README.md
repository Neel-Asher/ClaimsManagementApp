# InsuranceIQ — Node.js Notification Service
### Branch: `dev-node-notifications-backend`

> **Insurance Intelligence Platform** — A real-time notification microservice built with Node.js, Express, and Socket.IO. It manages all push notifications for the platform, delivering claim updates, KYC approvals, and policy renewal alerts to users in real time via WebSockets. It also runs a scheduled cron job for policy renewal reminders.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Tech Stack & Versions](#tech-stack--versions)
4. [Folder Structure](#folder-structure)
5. [API Endpoints](#api-endpoints)
6. [WebSocket Events](#websocket-events)
7. [Cron Jobs](#cron-jobs)
8. [Database Schema](#database-schema)
9. [Authentication](#authentication)
10. [Environment Variables](#environment-variables)
11. [Installation & Setup](#installation--setup)
12. [Running the Service](#running-the-service)
13. [React Client Integration](#react-client-integration)
14. [Inter-Service Communication](#inter-service-communication)

---

## Project Overview

The Notification Service is an independently deployable microservice that acts as the real-time communication backbone of the InsuranceIQ platform. It is triggered by the Spring Boot backend whenever a significant business event occurs (e.g., a claim is approved or rejected, a KYC check completes, a policy is about to expire).

Key responsibilities:

- **Real-time delivery:** Push notifications to connected React clients over WebSockets using Socket.IO
- **Persistent storage:** Store all notification records in MySQL for inbox retrieval
- **Role-based routing:** Emit notifications to individual users or entire role groups (Admin, Agent, Customer, Claims Manager)
- **Scheduled reminders:** A `node-cron` job checks for upcoming policy renewals daily and pushes reminders automatically
- **REST API:** Expose HTTP endpoints for Spring Boot to trigger events and for the React client to fetch notification history

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│           Node.js Notification Service (Port 5001)           │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │               Express HTTP Server                     │   │
│  │  /notifications  │  /events  │  /health               │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │            Socket.IO (WebSocket Layer)                │   │
│  │  JWT Auth Middleware → Room Assignment (user/role)    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │         node-cron (Scheduled Jobs)                    │   │
│  │  Daily: Scan for expiring policies → push reminders   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │         MySQL (via mysql2 driver)                     │   │
│  │  notifications table │ events log                     │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
          ┌────────────────┼────────────────────┐
          │                │                    │
          ▼                ▼                    ▼
  ┌──────────────┐ ┌───────────────┐  ┌──────────────────┐
  │ Spring Boot  │ │  React SPA    │  │ React SPA        │
  │ :8080        │ │  (HTTP calls) │  │ (WebSocket conn) │
  │ (triggers)   │ │               │  │                  │
  └──────────────┘ └───────────────┘  └──────────────────┘
```

---

## Tech Stack & Versions

| Technology    | Version   | Purpose                                         |
|---------------|-----------|-------------------------------------------------|
| Node.js       | ≥18.x     | JavaScript runtime                              |
| Express       | ^4.19.2   | HTTP server and REST routing                    |
| Socket.IO     | ^4.7.5    | WebSocket server with room support              |
| mysql2        | ^3.10.0   | MySQL driver (promise-based)                    |
| jsonwebtoken  | ^9.0.2    | JWT validation for socket auth middleware       |
| node-cron     | ^3.0.3    | Cron job scheduler (policy renewal reminders)   |
| axios         | ^1.7.2    | HTTP client (calls to Spring Boot if needed)    |
| dotenv        | ^16.4.5   | `.env` file loading                             |
| cors          | ^2.8.5    | CORS middleware for Express                     |
| helmet        | ^7.1.0    | HTTP security headers                           |
| nodemon       | ^3.1.3    | Dev: auto-restart on file changes               |
| npm           | ≥9.x      | Package manager                                 |

---

## Folder Structure

```
notification-service/
├── server.js                       # Entry point: HTTP server + Socket.IO init + cron start
├── package.json                    # Dependencies and npm scripts
├── schema.sql                      # MySQL schema for notifications database
├── .env.example                    # Template environment file
│
├── src/
│   ├── app.js                      # Express app setup (middleware, route registration)
│   │
│   ├── config/
│   │   └── db.js                   # mysql2 pool creation and testConnection()
│   │
│   ├── controllers/
│   │   ├── notificationController.js  # CRUD handlers for notification records
│   │   └── eventController.js         # Handlers for incoming event triggers from Spring Boot
│   │
│   ├── cron/
│   │   └── renewalCron.js          # node-cron: daily policy renewal reminder job
│   │
│   ├── middleware/
│   │   └── authMiddleware.js       # Express JWT auth middleware (for REST routes)
│   │
│   ├── routes/
│   │   ├── notificationRoutes.js   # GET /notifications, PATCH /notifications/:id/read
│   │   └── eventRoutes.js          # POST /events/trigger
│   │
│   ├── services/
│   │   └── notificationService.js  # DB queries and Socket.IO emission logic
│   │
│   └── sockets/
│       └── socketManager.js        # Socket.IO server init, JWT auth middleware, room management
│
└── examples/
    ├── NotificationBell.jsx        # React component: notification bell with badge
    ├── NotificationList.jsx        # React component: dropdown notification list
    ├── NotificationProvider.jsx    # React context provider for notification state
    ├── NotificationBell.css        # CSS for bell component
    └── socket-test.html            # Standalone HTML socket test client
```

---

## API Endpoints

All REST endpoints require `Authorization: Bearer <JWT>` unless noted.

### Health
| Method | Endpoint   | Auth    | Description              |
|--------|------------|---------|--------------------------|
| GET    | `/health`  | Public  | Service health check     |

### Notifications
| Method | Endpoint                          | Auth      | Description                              |
|--------|-----------------------------------|-----------|------------------------------------------|
| GET    | `/notifications`                  | Required  | Get all notifications for current user   |
| PATCH  | `/notifications/:id/read`         | Required  | Mark a specific notification as read     |
| PATCH  | `/notifications/read-all`         | Required  | Mark all notifications as read           |
| DELETE | `/notifications/:id`              | Required  | Delete a notification                    |

### Events (called by Spring Boot)
| Method | Endpoint          | Auth      | Description                                    |
|--------|-------------------|-----------|------------------------------------------------|
| POST   | `/events/trigger` | Required  | Trigger a new notification event               |

**Sample event trigger payload (from Spring Boot):**
```json
{
  "userId": 42,
  "eventType": "CLAIM_APPROVED",
  "title": "Your claim has been approved",
  "message": "Claim #CLM-2024-001 for ₹50,000 has been approved and will be settled within 3 business days.",
  "role": "CUSTOMER"
}
```

---

## WebSocket Events

### Connection
The React client connects with a JWT in the socket handshake:

```javascript
const socket = io('http://localhost:5001', {
  auth: { token: localStorage.getItem('token') }
});
```

### Room Assignment
On connect, the socket middleware:
1. Validates the JWT
2. Extracts `userId` and `role`
3. Joins the socket to `user_<userId>` (personal room)
4. Joins the socket to `role_<ROLE>` (broadcast room)

### Emitted Events

| Event Name          | Direction     | Description                                 |
|---------------------|---------------|---------------------------------------------|
| `notification`      | Server → Client | New notification payload delivered to user |
| `connect`           | Client ← Server | Confirms WebSocket connection              |
| `disconnect`        | Client ← Server | Notifies of disconnection                  |

### Notification Payload Shape
```json
{
  "id": 123,
  "type": "CLAIM_APPROVED",
  "title": "Your claim has been approved",
  "message": "Claim #CLM-2024-001 has been approved.",
  "read": false,
  "createdAt": "2024-11-15T10:30:00Z"
}
```

### Emitting to a User vs. Role
- **User-specific:** `emitToUser(userId, eventType, payload)` → sends to `user_<userId>` room
- **Role-wide broadcast:** `emitToRole(role, eventType, payload)` → sends to `role_<ROLE>` room (e.g., all admins)

---

## Cron Jobs

The renewal cron job is defined in `src/cron/renewalCron.js` and initialized on server start.

| Job                    | Schedule     | Description                                              |
|------------------------|--------------|----------------------------------------------------------|
| Policy Renewal Reminder| Daily (00:00)| Queries DB for policies expiring in the next 30 days and pushes renewal reminders to affected customers and their agents |

---

## Database Schema

The service uses a **separate MySQL database** (`insuranceiq_notifications`) from the main Spring Boot database. Schema is in `schema.sql`.

```sql
-- Notifications
CREATE TABLE notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  type        VARCHAR(100) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events log (audit trail)
CREATE TABLE events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  event_type  VARCHAR(100) NOT NULL,
  payload     JSON,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Authentication

Both the **HTTP REST routes** and the **WebSocket connections** are protected by JWT.

- REST routes use the `authMiddleware.js` Express middleware: validates `Authorization: Bearer <token>`
- WebSocket connections use a Socket.IO middleware in `socketManager.js`: validates `socket.handshake.auth.token`
- **The JWT secret must match the one used by Spring Boot** (`app.jwt.secret` in `application.properties`)

---

## Environment Variables

Create a `.env` file in the `notification-service/` directory:

```env
PORT=5001

# MySQL Database (separate from Spring Boot's DB)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=insuranceiq_notifications
DB_USER=root
DB_PASSWORD=your_password

# Must match Spring Boot's JWT secret exactly
JWT_SECRET=InsuranceIQSecretKey2024VeryLongSecretKeyForHS256AlgorithmMinimum256Bits

# Spring Boot URL (for querying policy data in cron jobs)
SPRING_BOOT_URL=http://localhost:8080
```

---

## Installation & Setup

### Prerequisites
- Node.js **18.x or higher**
- npm **9.x or higher**
- MySQL 8.x running locally (separate DB from Spring Boot)

### Steps

```bash
# 1. Clone and switch to the branch
git clone https://github.com/Neel-Asher/ClaimsManagementApp.git
cd ClaimsManagementApp
git checkout dev-node-notifications-backend

# 2. Navigate to the service directory
cd notification-service

# 3. Install dependencies
npm install

# 4. Create the environment file
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret

# 5. Create the MySQL database and run the schema
mysql -u root -p
CREATE DATABASE insuranceiq_notifications;
exit;

mysql -u root -p insuranceiq_notifications < schema.sql
```

---

## Running the Service

```bash
# Development (with auto-restart via nodemon)
npm run dev

# Production
npm start
```

Server will start on: `http://localhost:5001`

On startup you will see:
```
╔══════════════════════════════════════════════════════╗
║   InsuranceIQ — Notification Service                 ║
║   AI Powered Insurance & Claims Management Platform  ║
╠══════════════════════════════════════════════════════╣
║   🚀 Server running on port 5001                     ║
║   📡 Socket.IO ready                                 ║
║   🗄️  MySQL connected                                ║
║   ⏰ Cron jobs scheduled                             ║
╚══════════════════════════════════════════════════════╝
```

---

## React Client Integration

Pre-built React example components are in the `examples/` directory:

| File                        | Description                                        |
|-----------------------------|----------------------------------------------------|
| `NotificationBell.jsx`      | Bell icon with unread count badge                  |
| `NotificationList.jsx`      | Dropdown list of recent notifications              |
| `NotificationProvider.jsx`  | React context that manages socket connection + state|
| `NotificationBell.css`      | Styles for the bell component                      |
| `socket-test.html`          | Standalone browser test page (no React required)   |

To integrate into your React app, wrap your app with `NotificationProvider` and use `NotificationBell` in the navbar. The `socketService.js` in the React frontend branch is already pre-configured to connect to this service.

---

## Inter-Service Communication

| Caller            | Method   | Endpoint                        | Purpose                                 |
|-------------------|----------|---------------------------------|-----------------------------------------|
| Spring Boot       | HTTP POST| `/events/trigger`               | Trigger notification on business event  |
| React Frontend    | WebSocket| Socket.IO connection on `:5001` | Receive real-time notification push     |
| React Frontend    | HTTP GET | `/notifications`                | Fetch notification history/inbox        |
| Cron Job          | Internal | (queries Spring Boot `/api/policies`) | Check expiring policies for reminders |
