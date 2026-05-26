// ============================================
// InsuranceIQ Notification Service — Cron Scheduler
// ============================================

const cron = require('node-cron');
const axios = require('axios');
const notificationService = require('../services/notificationService');

/**
 * Initialize all scheduled cron jobs
 */
function initializeCronJobs() {
    // ── Policy Renewal Reminder — Runs daily at 9:00 AM ──
    cron.schedule('0 9 * * *', async () => {
        console.log('[CRON] 🔄 Running policy renewal check...');

        try {
            const springBootUrl = process.env.SPRING_BOOT_URL || 'http://localhost:8080';
            const response = await axios.get(`${springBootUrl}/api/policies/renewals/upcoming`);

            const renewals = response.data;

            if (!Array.isArray(renewals) || renewals.length === 0) {
                console.log('[CRON] ℹ️ No upcoming renewals found.');
                return;
            }

            console.log(`[CRON] 📋 Found ${renewals.length} upcoming renewal(s)`);

            // Filter and send reminders for 30, 7, and 1 day thresholds
            const reminderDays = [30, 7, 1];

            for (const renewal of renewals) {
                const { policyId, customerId, agentId, daysRemaining } = renewal;

                if (reminderDays.includes(daysRemaining)) {
                    await notificationService.handlePolicyRenewalDue({
                        policyId,
                        customerId,
                        agentId,
                        daysRemaining,
                    });

                    console.log(`[CRON] ✅ Renewal reminder sent — Policy #${policyId} | ${daysRemaining} day(s) remaining`);
                }
            }

            console.log('[CRON] ✅ Policy renewal check completed');
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('[CRON] ⚠️ Spring Boot service unavailable — skipping renewal check');
            } else {
                console.error('[CRON] ❌ Error during renewal check:', error.message);
            }
        }
    });

    console.log('[CRON] ✅ Policy renewal cron job scheduled (daily at 9:00 AM)');
}

module.exports = { initializeCronJobs };
