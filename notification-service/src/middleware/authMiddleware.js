// ============================================
// InsuranceIQ Notification Service — JWT Middleware
// ============================================

const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token from Authorization header
 * Format: Bearer <token>
 */
function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request
        req.user = {
            userId: decoded.userId || decoded.id || decoded.sub,
            role: decoded.role || 'CUSTOMER',
        };

        next();
    } catch (error) {
        console.error('[AUTH] ❌ Token verification failed:', error.message);
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token.',
        });
    }
}

module.exports = { verifyToken };
