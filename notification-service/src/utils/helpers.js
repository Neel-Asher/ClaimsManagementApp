// ============================================
// InsuranceIQ Notification Service — Utility Helpers
// ============================================

/**
 * Format a date to ISO string
 * @param {Date} date
 * @returns {string}
 */
function formatTimestamp(date = new Date()) {
    return date.toISOString();
}

/**
 * Generate a standard success response
 */
function successResponse(res, message, data = null, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}

/**
 * Generate a standard error response
 */
function errorResponse(res, message, statusCode = 500) {
    return res.status(statusCode).json({
        success: false,
        message,
    });
}

module.exports = {
    formatTimestamp,
    successResponse,
    errorResponse,
};
