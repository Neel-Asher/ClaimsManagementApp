// ============================================
// InsuranceIQ Notification Service — Express App
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const notificationRoutes = require('./routes/notificationRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// ── Security Middleware ──
app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request Logger ──
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ── API Routes ──
app.use('/api/notifications', notificationRoutes);
app.use('/internal/events', eventRoutes);

// ── Health Check ──
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'InsuranceIQ Notification Service',
        status: 'UP',
        timestamp: new Date().toISOString(),
    });
});

// ── Root Route ──
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'InsuranceIQ Notification Service',
        version: '1.0.0',
        description: 'Real-time notification module for InsuranceIQ platform',
        endpoints: {
            health: 'GET /health',
            notifications: 'GET /api/notifications/:userId',
            markRead: 'PUT /api/notifications/read/:notificationId',
            markAllRead: 'PUT /api/notifications/read-all/:userId',
            deleteNotification: 'DELETE /api/notifications/:notificationId',
            testNotification: 'POST /api/notifications/test',
            claimFiled: 'POST /internal/events/claim-filed',
            claimStatusUpdated: 'POST /internal/events/claim-status-updated',
            fraudAlert: 'POST /internal/events/fraud-alert',
            paymentReceived: 'POST /internal/events/payment-received',
            claimSettled: 'POST /internal/events/claim-settled',
        },
    });
});

// ── 404 Handler ──
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.url}`,
    });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
    console.error('[ERROR] Unhandled:', err.message);
    res.status(500).json({
        success: false,
        message: 'Internal server error.',
    });
});

module.exports = app;
