// ============================================
// InsuranceIQ Notification Service — Server Entry Point
// ============================================

require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { testConnection } = require('./src/config/db');
const { initializeSocket } = require('./src/sockets/socketManager');
const { initializeCronJobs } = require('./src/cron/renewalCron');

const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO on the HTTP server
initializeSocket(server);

// Start the server
async function startServer() {
    try {
        // Test database connection
        await testConnection();

        // Initialize cron jobs
        initializeCronJobs();

        // Start listening
        server.listen(PORT, () => {
            console.log('');
            console.log('╔══════════════════════════════════════════════════════╗');
            console.log('║   InsuranceIQ — Notification Service                ║');
            console.log('║   AI Powered Insurance & Claims Management Platform ║');
            console.log('╠══════════════════════════════════════════════════════╣');
            console.log(`║   🚀 Server running on port ${PORT}                    ║`);
            console.log(`║   📡 Socket.IO ready                                ║`);
            console.log(`║   🗄️  MySQL connected                               ║`);
            console.log(`║   ⏰ Cron jobs scheduled                            ║`);
            console.log('╠══════════════════════════════════════════════════════╣');
            console.log(`║   Health:  http://localhost:${PORT}/health              ║`);
            console.log(`║   APIs:    http://localhost:${PORT}/                    ║`);
            console.log('╚══════════════════════════════════════════════════════╝');
            console.log('');
        });
    } catch (error) {
        console.error('[SERVER] ❌ Failed to start:', error.message);
        process.exit(1);
    }
}

startServer();
