# InsuranceIQ Notification Service Integration Guide

This document describes how the Notification Service integrates with the Spring Boot Backend and Python ML Service.

## Architecture Overview

```
┌─────────────────────┐
│   Python ML Service │
│   (FastAPI:8000)    │
└──────────┬──────────┘
           │
           │ POST /internal/events/fraud-alert
           │
┌──────────▼─────────────────────────────┐
│  Notification Service (Node.js:5001)   │
│  - Socket.IO WebSocket Server          │
│  - MySQL Database                      │
│  - Real-time notifications             │
└──────────▲─────────────────────────────┘
           │
           │ POST /internal/events/*
           │
┌──────────┴──────────┐
│  Spring Boot        │
│  Backend (8080)     │
└─────────────────────┘
```

## Service-to-Service Communication

### 1. Python ML Service → Notification Service

**Endpoint:** `POST /internal/events/fraud-alert`

When the Python fraud detection service identifies a high-risk claim, it sends a notification to the claims manager.

```python
from services.notification_client import get_notification_client

client = get_notification_client()
await client.send_fraud_alert(
    claim_id="CLM-001",
    fraud_probability=75.5,
    risk_status="HIGH_RISK",
    claims_manager_id=5,
)
```

**Configuration:**
- Set `NOTIFICATION_SERVICE_URL=http://localhost:5001` in Python `.env`
- The service automatically creates the HTTP client as a singleton

### 2. Spring Boot Backend → Notification Service

**Endpoint:** `POST /internal/events/claim-filed`

When a customer files a new claim in the Spring Boot backend, it notifies the assigned claims manager.

```java
notificationService.sendInternalEvent(
    "/internal/events/claim-filed",
    Map.of(
        "claimId", claim.getClaimId(),
        "customerId", claim.getCustomer().getCustomerId(),
        "claimsManagerId", assignedManager.getId(),
        "claimType", claim.getClaimType(),
        "claimAmount", claim.getClaimAmount()
    )
);
```

**Configuration:**
- Set `app.notification-service.url=http://localhost:5001` in `application.properties`
- The Spring `NotificationService` class handles HTTP communication

### 3. Internal Events Supported

| Event | Caller | Endpoint | Description |
|-------|--------|----------|-------------|
| Claim Filed | Spring Boot | `/internal/events/claim-filed` | New claim submitted |
| Claim Status Updated | Spring Boot | `/internal/events/claim-status-updated` | Claim approved/rejected |
| Fraud Alert | Python ML | `/internal/events/fraud-alert` | High-risk fraud detected |
| Payment Received | Spring Boot | `/internal/events/payment-received` | Premium payment processed |
| Claim Settled | Spring Boot | `/internal/events/claim-settled` | Claim settlement completed |
| Policy Renewal Due | Spring Boot | `/internal/events/policy-renewal-due` | Policy near renewal date |

## Real-Time WebSocket Communication

The Notification Service uses Socket.IO to emit real-time notifications to connected clients.

### Frontend Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5001', {
    auth: {
        token: jwtToken,  // Must include valid JWT token
    },
});

// Listen for notifications
socket.on('notification', (payload) => {
    console.log('New notification:', payload);
    // Update UI with notification
});
```

### Auto-Room Assignment

When a client connects with a JWT token, they are automatically added to:
- **User room:** `user_${userId}` - For user-specific notifications
- **Role room:** `role_${userRole}` - For role-based broadcasts (ADMIN, AGENT, CLAIMS_MANAGER, CUSTOMER)

## Database Schema

### Notifications Table

```sql
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    event_type VARCHAR(100) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);
```

**Note:** Role-based notifications use `user_id = 0`

## Setup Instructions

### 1. Start the MySQL Database

```bash
# Create notification database
mysql -u root -p < notification-service/schema.sql
```

### 2. Configure Environment Variables

**Notification Service (`.env`):**
```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=insuranceiq_notifications
DB_USER=root
DB_PASSWORD=root
JWT_SECRET=insuranceiq_secret
SPRING_BOOT_URL=http://localhost:8080
PYTHON_ML_SERVICE_URL=http://localhost:8000
```

**Python ML Service (`.env`):**
```env
NOTIFICATION_SERVICE_URL=http://localhost:5001
SPRING_BOOT_URL=http://localhost:8080
SERVICE_SECRET=InsuranceIQInternalServiceSecret2024
```

**Spring Boot Backend (`application.properties`):**
```properties
app.notification-service.url=http://localhost:5001
app.fraud-service.url=http://localhost:8000
app.service-secret=InsuranceIQInternalServiceSecret2024
```

### 3. Start Services

```bash
# Terminal 1: Notification Service
cd notification-service
npm install
npm start

# Terminal 2: Python ML Service
cd ClaimsManagementApp-dev-python-ml-service
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Spring Boot Backend
cd ClaimsManagementApp-dev-spring-backend/server
mvn spring-boot:run
```

## Testing Integration

### Test Fraud Alert Flow

1. File a claim via Spring Boot API
2. Call fraud prediction endpoint in Python service
3. Observe notification in Node.js service logs
4. Check notifications table in MySQL

```bash
# 1. File a claim
curl -X POST http://localhost:8080/api/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "policyId": "POL-001",
    "customerId": 1,
    "claimType": "Auto",
    "claimAmount": 50000
  }'

# 2. Get claim ID from response and predict fraud
curl -X POST http://localhost:8000/predict/fraud/CLM-001 \
  -H "Content-Type: application/json" \
  -d '{
    "claim_amount": 50000,
    "days_since_policy_start": 365,
    "claim_type": "Auto",
    "previous_claims_count": 0,
    "customer_age": 35,
    "policy_premium_ratio": 0.15,
    "surveyor_mismatch_flag": false,
    "claims_manager_id": 5
  }'

# 3. Check notifications in database
mysql -u root -p insuranceiq_notifications \
  -e "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;"
```

### Test Notification API Endpoints

```bash
# Send test notification
curl -X POST http://localhost:5001/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "title": "Test Notification",
    "message": "This is a test",
    "eventType": "TEST"
  }'

# Get user notifications
curl -X GET "http://localhost:5001/api/notifications/1?page=1&limit=20" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Mark as read
curl -X PUT http://localhost:5001/api/notifications/read/1 \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Troubleshooting

### Issue: Notifications not appearing
- **Check:** Is the notification service running on port 5001?
- **Check:** Is the database connection working? Check MySQL logs
- **Check:** Are environment variables configured correctly?

### Issue: Fraud alert not reaching notification service
- **Check:** Is Python service accessible at `http://localhost:8000`?
- **Check:** Is the `NOTIFICATION_SERVICE_URL` configured in Python `.env`?
- **Check:** Check Python service logs for HTTP errors

### Issue: Socket.IO connection failures
- **Check:** Is JWT token valid and properly formatted?
- **Check:** Are CORS settings allowing your frontend origin?
- **Check:** Check browser console for WebSocket connection errors

### Issue: Database connection errors
- **Check:** Is MySQL server running?
- **Check:** Are database credentials correct?
- **Check:** Does the `insuranceiq_notifications` database exist?

## API Reference

### Notification Endpoints

#### GET /api/notifications/:userId
Get paginated notifications for a user

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `unread` (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### POST /api/notifications/emit
Emit a notification to user/role

**Body:**
```json
{
  "userId": 1,
  "title": "Your Policy Renewed",
  "message": "Policy POL-001 has been renewed for another year",
  "eventType": "POLICY_RENEWAL"
}
```

Or for role-based broadcast:
```json
{
  "role": "CLAIMS_MANAGER",
  "title": "System Update",
  "message": "Maintenance window scheduled for tonight",
  "eventType": "SYSTEM_ALERT"
}
```

#### PUT /api/notifications/read/:notificationId
Mark notification as read

#### DELETE /api/notifications/:notificationId
Delete a notification

## Key Considerations

1. **Async Operations**: The notification sending is non-blocking. If the notification service is unavailable, the transaction still completes.

2. **JWT Authentication**: Internal service-to-service communication bypasses JWT checks. Only user-facing endpoints require authentication.

3. **Real-time Updates**: Socket.IO maintains persistent connections. Users will receive notifications in real-time if connected.

4. **Database Indexing**: The notifications table has indexes on frequently queried columns for optimal performance.

5. **Error Handling**: All services handle notification failures gracefully to prevent cascading failures.

## Future Enhancements

- [ ] Email notifications for offline users
- [ ] SMS alerts for critical notifications
- [ ] Notification preferences and opt-out management
- [ ] Push notifications via Firebase Cloud Messaging
- [ ] Notification templates and personalization
- [ ] Batch notification processing for high-volume events
