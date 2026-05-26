// ============================================
// InsuranceIQ Notification Service — Notification Routes
// ============================================

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

// ── Public Notification APIs ──

// Get notifications for a user (paginated)
// GET /api/notifications/:userId?page=1&limit=20&unread=true
router.get('/:userId', verifyToken, notificationController.getNotifications);

// Mark a single notification as read
// PUT /api/notifications/read/:notificationId
router.put('/read/:notificationId', verifyToken, notificationController.markAsRead);

// Mark all notifications as read for a user
// PUT /api/notifications/read-all/:userId
router.put('/read-all/:userId', verifyToken, notificationController.markAllAsRead);

// Delete a notification
// DELETE /api/notifications/:notificationId
router.delete('/:notificationId', verifyToken, notificationController.deleteNotification);

// ── Service-to-Service Endpoints (no auth required) ──

// Send a notification via emit endpoint (called by Spring Boot)
// POST /api/notifications/emit
router.post('/emit', notificationController.emitNotification);

// Send a test notification (for development/demo)
// POST /api/notifications/test
router.post('/test', notificationController.sendTestNotification);

module.exports = router;
