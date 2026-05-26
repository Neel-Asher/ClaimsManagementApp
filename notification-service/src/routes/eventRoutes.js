// ============================================
// InsuranceIQ Notification Service — Internal Event Routes
// ============================================

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// ── Internal Event APIs ──
// These are called by Spring Boot backend and Python FastAPI service
// No JWT required (internal service-to-service communication)

// POST /internal/events/claim-filed
router.post('/claim-filed', eventController.claimFiled);

// POST /internal/events/claim-status-updated
router.post('/claim-status-updated', eventController.claimStatusUpdated);

// POST /internal/events/fraud-alert
router.post('/fraud-alert', eventController.fraudAlert);

// POST /internal/events/payment-received
router.post('/payment-received', eventController.paymentReceived);

// POST /internal/events/claim-settled
router.post('/claim-settled', eventController.claimSettled);

// POST /internal/events/policy-renewal-due
router.post('/policy-renewal-due', eventController.policyRenewalDue);

module.exports = router;
