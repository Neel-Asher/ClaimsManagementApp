// ============================================
// InsuranceIQ Notification Service — MySQL Connection
// ============================================

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Test database connection on startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('[DB] ✅ MySQL connected successfully');
        connection.release();
    } catch (error) {
        console.error('[DB] ❌ MySQL connection failed:', error.message);
        process.exit(1);
    }
}

module.exports = { pool, testConnection };
