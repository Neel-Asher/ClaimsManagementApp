// ============================================
// InsuranceIQ Notification Service — Socket.IO Setup
// ============================================

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.IO server with JWT authentication
 * @param {http.Server} httpServer - The HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
function initializeSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // ── JWT Authentication Middleware ──
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            console.log('[SOCKET] ❌ Connection rejected — No token provided');
            return next(new Error('Authentication error: Token required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId || decoded.id || decoded.sub;
            socket.role = decoded.role || 'CUSTOMER';
            next();
        } catch (err) {
            console.log('[SOCKET] ❌ Connection rejected — Invalid token');
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    // ── Connection Handler ──
    io.on('connection', (socket) => {
        const { userId, role } = socket;

        // Join user-specific room
        const userRoom = `user_${userId}`;
        socket.join(userRoom);

        // Join role-based room
        const roleRoom = `role_${role}`;
        socket.join(roleRoom);

        console.log(`[SOCKET CONNECTED] 🟢 User ${userId} | Role: ${role} | Rooms: ${userRoom}, ${roleRoom}`);

        // Handle disconnect
        socket.on('disconnect', (reason) => {
            console.log(`[SOCKET DISCONNECTED] 🔴 User ${userId} | Reason: ${reason}`);
        });

        // Handle errors
        socket.on('error', (err) => {
            console.error(`[SOCKET ERROR] ⚠️ User ${userId}:`, err.message);
        });
    });

    console.log('[SOCKET] ✅ Socket.IO server initialized');
    return io;
}

/**
 * Get the Socket.IO server instance
 * @returns {Server} Socket.IO instance
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initializeSocket() first.');
    }
    return io;
}

/**
 * Emit a notification event to a specific user
 * @param {number} userId - Target user ID
 * @param {string} eventType - Event type name
 * @param {object} payload - Notification payload
 */
function emitToUser(userId, eventType, payload) {
    if (!io) return;
    const room = `user_${userId}`;
    io.to(room).emit('notification', payload);
    console.log(`[NOTIFICATION SENT] 📨 Event: ${eventType} → User: ${userId}`);
}

/**
 * Emit a notification event to all users with a specific role
 * @param {string} role - Target role (ADMIN, AGENT, CUSTOMER, CLAIMS_MANAGER)
 * @param {string} eventType - Event type name
 * @param {object} payload - Notification payload
 */
function emitToRole(role, eventType, payload) {
    if (!io) return;
    const room = `role_${role}`;
    io.to(room).emit('notification', payload);
    console.log(`[NOTIFICATION SENT] 📨 Event: ${eventType} → Role: ${role}`);
}

module.exports = { initializeSocket, getIO, emitToUser, emitToRole };
