// ============================================
// InsuranceIQ Notification Service — Notification Service
// ============================================

const { pool } = require('../config/db');
const { emitToUser, emitToRole } = require('../sockets/socketManager');

/**
 * Build a standard notification payload
 */
function buildPayload(notification) {
    return {
        notificationId: notification.notification_id,
        eventType: notification.event_type,
        title: notification.title,
        message: notification.message,
        isRead: notification.is_read,
        timestamp: notification.created_at,
    };
}

// ──────────────────────────────────────────────
// CRUD Operations
// ──────────────────────────────────────────────

/**
 * Save a notification to MySQL and emit via Socket.IO
 * @param {number} userId - Target user ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} eventType - Event type identifier
 * @returns {object} Saved notification
 */
async function createAndEmit(userId, title, message, eventType) {
    const [result] = await pool.execute(
        'INSERT INTO notifications (user_id, title, message, event_type) VALUES (?, ?, ?, ?)',
        [userId, title, message, eventType]
    );

    const notification = {
        notification_id: result.insertId,
        user_id: userId,
        title,
        message,
        event_type: eventType,
        is_read: false,
        created_at: new Date().toISOString(),
    };

    // Emit real-time notification to user
    emitToUser(userId, eventType, buildPayload(notification));

    return notification;
}

/**
 * Save and emit a notification to all users with a specific role
 */
async function createAndEmitToRole(role, title, message, eventType) {
    // For role-based notifications, store with user_id = 0 (broadcast)
    const [result] = await pool.execute(
        'INSERT INTO notifications (user_id, title, message, event_type) VALUES (?, ?, ?, ?)',
        [0, title, message, eventType]
    );

    const notification = {
        notification_id: result.insertId,
        user_id: 0,
        title,
        message,
        event_type: eventType,
        is_read: false,
        created_at: new Date().toISOString(),
    };

    emitToRole(role, eventType, buildPayload(notification));

    return notification;
}

/**
 * Get paginated notifications for a user
 */
async function getNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (unreadOnly) {
        query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
    const countParams = [userId];
    if (unreadOnly) {
        countQuery += ' AND is_read = FALSE';
    }
    const [countResult] = await pool.execute(countQuery, countParams);

    return {
        notifications: rows.map(buildPayload),
        total: countResult[0].total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(countResult[0].total / limit),
    };
}

/**
 * Mark a single notification as read
 */
async function markAsRead(notificationId) {
    const [result] = await pool.execute(
        'UPDATE notifications SET is_read = TRUE WHERE notification_id = ?',
        [notificationId]
    );
    return result.affectedRows > 0;
}

/**
 * Mark all notifications as read for a user
 */
async function markAllAsRead(userId) {
    const [result] = await pool.execute(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
        [userId]
    );
    return result.affectedRows;
}

/**
 * Delete a notification
 */
async function deleteNotification(notificationId) {
    const [result] = await pool.execute(
        'DELETE FROM notifications WHERE notification_id = ?',
        [notificationId]
    );
    return result.affectedRows > 0;
}

// ──────────────────────────────────────────────
// Business Event Handlers
// ──────────────────────────────────────────────

/**
 * Handle claim filed event
 * Notifies the assigned claims manager
 */
async function handleClaimFiled({ claimId, customerId, claimsManagerId, claimType, claimAmount }) {
    const title = 'New Claim Filed';
    const message = `New ${claimType} claim #${claimId} filed — Amount: ₹${claimAmount}`;

    return createAndEmit(claimsManagerId, title, message, 'CLAIM_FILED');
}

/**
 * Handle claim status updated event
 * Notifies customer and agent
 */
async function handleClaimStatusUpdated({ claimId, customerId, agentId, status, remarks }) {
    const title = `Claim ${status}`;
    const message = `Your claim #${claimId} has been ${status.toLowerCase()}. ${remarks || ''}`.trim();

    const notifications = [];
    notifications.push(await createAndEmit(customerId, title, message, 'CLAIM_STATUS_UPDATED'));
    if (agentId) {
        notifications.push(await createAndEmit(agentId, title, message, 'CLAIM_STATUS_UPDATED'));
    }
    return notifications;
}

/**
 * Handle fraud alert from Python ML service
 * Notifies claims manager
 */
async function handleFraudAlert({ claimId, fraudProbability, riskStatus, claimsManagerId }) {
    const title = 'Fraud Alert — High Risk Detected';
    const message = `High fraud risk detected for Claim #${claimId} — Fraud Probability: ${fraudProbability}% | Status: ${riskStatus}`;

    return createAndEmit(claimsManagerId, title, message, 'FRAUD_ALERT');
}

/**
 * Handle premium payment received
 * Notifies customer
 */
async function handlePaymentReceived({ customerId, policyId, amount, paymentDate }) {
    const title = 'Payment Received';
    const message = `Premium payment of ₹${amount} received for Policy #${policyId} on ${paymentDate || new Date().toLocaleDateString()}.`;

    return createAndEmit(customerId, title, message, 'PREMIUM_PAYMENT_RECEIVED');
}

/**
 * Handle claim settlement
 * Notifies customer
 */
async function handleClaimSettled({ claimId, customerId, settlementAmount }) {
    const title = 'Claim Settled';
    const message = `Your claim #${claimId} has been settled. Settlement amount: ₹${settlementAmount}`;

    return createAndEmit(customerId, title, message, 'CLAIM_SETTLED');
}

/**
 * Handle policy renewal reminder
 * Notifies customer and agent
 */
async function handlePolicyRenewalDue({ policyId, customerId, agentId, daysRemaining }) {
    const title = 'Policy Renewal Reminder';
    const message = `Your policy #${policyId} is due for renewal in ${daysRemaining} day(s). Please renew to avoid lapse.`;

    const notifications = [];
    notifications.push(await createAndEmit(customerId, title, message, 'POLICY_RENEWAL_DUE'));
    if (agentId) {
        notifications.push(await createAndEmit(agentId, title, message, 'POLICY_RENEWAL_DUE'));
    }
    return notifications;
}

module.exports = {
    createAndEmit,
    createAndEmitToRole,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleClaimFiled,
    handleClaimStatusUpdated,
    handleFraudAlert,
    handlePaymentReceived,
    handleClaimSettled,
    handlePolicyRenewalDue,
};
