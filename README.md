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
