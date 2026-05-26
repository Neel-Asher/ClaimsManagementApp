// ============================================
// InsuranceIQ Notification Service — Notification Controller
// ============================================

const notificationService = require('../services/notificationService');
const { emitToUser, emitToRole } = require('../sockets/socketManager');

/**
 * GET /api/notifications/:userId
 * Get paginated notifications for a user
 */
async function getNotifications(req, res) {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20, unread } = req.query;
        const unreadOnly = unread === 'true';

        const result = await notificationService.getNotifications(userId, page, limit, unreadOnly);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[ERROR] getNotifications:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
    }
}

/**
 * PUT /api/notifications/read/:notificationId
 * Mark a single notification as read
 */
async function markAsRead(req, res) {
    try {
        const { notificationId } = req.params;
        const updated = await notificationService.markAsRead(notificationId);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read.',
        });
    } catch (error) {
        console.error('[ERROR] markAsRead:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
    }
}

/**
 * PUT /api/notifications/read-all/:userId
 * Mark all notifications as read for a user
 */
async function markAllAsRead(req, res) {
    try {
        const { userId } = req.params;
        const count = await notificationService.markAllAsRead(userId);

        return res.status(200).json({
            success: true,
            message: `${count} notification(s) marked as read.`,
            updatedCount: count,
        });
    } catch (error) {
        console.error('[ERROR] markAllAsRead:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
    }
}

/**
 * DELETE /api/notifications/:notificationId
 * Delete a notification
 */
async function deleteNotification(req, res) {
    try {
        const { notificationId } = req.params;
        const deleted = await notificationService.deleteNotification(notificationId);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification deleted.',
        });
    } catch (error) {
        console.error('[ERROR] deleteNotification:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to delete notification.' });
    }
}

/**
 * POST /api/notifications/emit
 * Generic emit endpoint called by Spring Boot backend
 * Can emit to a user, role, or both
 * 
 * Body: {
 *   userId?: number,
 *   role?: string,
 *   title: string,
 *   message: string,
 *   eventType: string
 * }
 */
async function emitNotification(req, res) {
    try {
        const { userId, role, title, message, eventType } = req.body;

        if (!title || !message || !eventType) {
            return res.status(400).json({
                success: false,
                message: 'title, message, and eventType are required.',
            });
        }

        if (!userId && !role) {
            return res.status(400).json({
                success: false,
                message: 'Either userId or role must be provided.',
            });
        }

        const results = [];

        // Emit to user if userId is provided
        if (userId) {
            const notification = await notificationService.createAndEmit(userId, title, message, eventType);
            results.push(notification);
            console.log(
                `[EMIT] ✅ Sent to user ${userId} — [${eventType}] ${title}`
            );
        }

        // Broadcast to role if role is provided
        if (role) {
            const notification = await notificationService.createAndEmitToRole(role, title, message, eventType);
            results.push(notification);
            console.log(
                `[EMIT] ✅ Broadcast to role ${role} — [${eventType}] ${title}`
            );
        }

        return res.status(201).json({
            success: true,
            message: 'Notification(s) emitted successfully.',
            data: results,
        });
    } catch (error) {
        console.error('[ERROR] emitNotification:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to emit notification.' });
    }
}

/**
 * POST /api/notifications/test
 * Send a test notification (for development/demo)
 */
async function sendTestNotification(req, res) {
    try {
        const { userId, title, message, eventType } = req.body;

        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'userId, title, and message are required.',
            });
        }

        const notification = await notificationService.createAndEmit(
            userId,
            title,
            message,
            eventType || 'TEST'
        );

        return res.status(201).json({
            success: true,
            message: 'Test notification sent.',
            data: notification,
        });
    } catch (error) {
        console.error('[ERROR] sendTestNotification:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to send test notification.' });
    }
}

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    emitNotification,
    sendTestNotification,
};
