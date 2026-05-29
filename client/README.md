# InsuranceIQ — AI-Powered Insurance Intelligence Platform

A modern, enterprise-grade React frontend for managing insurance policies, claims processing, fraud detection, and real-time notifications.

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** + Vite | UI framework & build tool |
| **TailwindCSS v4** | Utility-first styling |
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP API client |
| **Recharts** | Data visualization & charts |
| **Socket.IO Client** | Real-time notifications |
| **Lucide React** | Icon library |

## 📁 Project Structure

```
src/
├── components/
│   ├── charts/          # Recharts wrappers (Area, Bar, Line, Pie)
│   ├── common/          # DataTable, StatCard, StatusBadge
│   ├── layout/          # Sidebar, TopNavbar, DashboardLayout, ProtectedRoute
│   └── modals/          # Reusable Modal
├── context/
│   └── AuthContext.jsx  # JWT auth state management
├── data/
│   └── mockData.js      # Mock data for all entities
├── pages/
│   ├── admin/           # Admin Dashboard
│   ├── agent/           # Agent Dashboard
│   ├── analytics/       # Analytics Dashboard with charts
│   ├── auth/            # Login Page
│   ├── claims/          # Claims Submission & Workflow
│   ├── customer/        # Customer Dashboard
│   ├── customerMgmt/    # Customer Management (CRUD)
│   ├── fraud/           # Fraud Detection Report
│   ├── notifications/   # Notifications Center (Socket.IO)
│   └── policy/          # Policy Management
├── services/
│   ├── api.js           # Axios instances with JWT interceptors
│   ├── authService.js   # Auth API + mock fallback
│   ├── dataService.js   # CRUD services for all entities
│   └── socketService.js # Socket.IO client wrapper
├── utils/
│   └── helpers.js       # Formatting & utility functions
├── App.jsx              # Route definitions
├── main.jsx             # Entry point
└── index.css            # Global styles & Tailwind config
```

## 🔐 Roles & Access

| Role | Dashboard | Pages |
|---|---|---|
| **Admin** | Admin Dashboard | All pages |
| **Agent** | Agent Dashboard | Customers, Policies, Claims |
| **Customer** | Customer Dashboard | My Claims, Notifications |
| **Claims Manager** | Claims Workflow | Claims, Fraud, Analytics |

## 🛠️ Setup & Run

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start development server
npm run dev
```

## 🔗 Backend API Configuration

| Service | URL | Config |
|---|---|---|
| Spring Boot API | `http://localhost:8080/api` | `VITE_SPRING_API_URL` |
| Python FastAPI | `http://localhost:8000` | `VITE_PYTHON_API_URL` |
| Socket.IO Server | `http://localhost:3001` | `VITE_SOCKET_URL` |

> **Note:** The frontend includes comprehensive mock data and will work fully without backend services. Toggle `USE_MOCK = false` in service files to connect to live APIs.

## 🎨 Design

- Dark slate theme with blue accents
- Glassmorphism card effects
- Responsive layout (mobile + desktop)
- Custom animations and micro-interactions
- Inter font family from Google Fonts

## 📊 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@insuranceiq.com | demo123 |
| Agent | agent@insuranceiq.com | demo123 |
| Customer | customer@insuranceiq.com | demo123 |
| Claims Manager | claims@insuranceiq.com | demo123 |

## 📝 License

Capstone Project — InsuranceIQ Platform v1.0
