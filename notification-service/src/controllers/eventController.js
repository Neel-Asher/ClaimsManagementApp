// ============================================
// InsuranceIQ Notification Service — Internal Event Controller
// ============================================

const notificationService = require('../services/notificationService');

/**
 * POST /internal/events/claim-filed
 * Called by Spring Boot when a new claim is submitted
 * 
 * Body: { claimId, customerId, claimsManagerId, claimType, claimAmount }
 */
async function claimFiled(req, res) {
    try {
        const { claimId, customerId, claimsManagerId, claimType, claimAmount } = req.body;

        if (!claimId || !claimsManagerId) {
            return res.status(400).json({ success: false, message: 'claimId and claimsManagerId are required.' });
        }

        const notification = await notificationService.handleClaimFiled({
            claimId,
            customerId,
            claimsManagerId,
            claimType: claimType || 'General',
            claimAmount: claimAmount || 0,
        });

        console.log(`[EVENT] ✅ CLAIM_FILED — Claim #${claimId} → Manager ${claimsManagerId}`);

        return res.status(201).json({
            success: true,
            message: 'Claim filed notification sent.',
            data: notification,
        });
    } catch (error) {
        console.error('[ERROR] claimFiled:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to process claim filed event.' });
    }
}

/**
 * POST /internal/events/claim-status-updated
 * Called by Spring Boot when a claim is approved/rejected
 * 
 * Body: { claimId, customerId, agentId, status, remarks }
 */
async function claimStatusUpdated(req, res) {
    try {
        const { claimId, customerId, agentId, status, remarks } = req.body;

        if (!claimId || !customerId || !status) {
            return res.status(400).json({ success: false, message: 'claimId, customerId, and status are required.' });
        }

        const notifications = await notificationService.handleClaimStatusUpdated({
            claimId,
            customerId,
            agentId,
            status,
            remarks,
        });

        console.log(`[EVENT] ✅ CLAIM_STATUS_UPDATED — Claim #${claimId} → ${status}`);

        return res.status(201).json({
            success: true,
            message: 'Claim status notification sent.',
            data: notifications,
        });
    } catch (error) {
        console.error('[ERROR] claimStatusUpdated:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to process claim status event.' });
    }
}

/**
 * POST /internal/events/fraud-alert
 * Called by Python FastAPI when fraud score is generated
 * 
 * Body: { claimId, fraudProbability, riskStatus, claimsManagerId }
 */
async function fraudAlert(req, res) {
    try {
        const { claimId, fraudProbability, riskStatus, claimsManagerId } = req.body;

        if (!claimId || !claimsManagerId) {
            return res.status(400).json({ success: false, message: 'claimId and claimsManagerId are required.' });
        }

        const notification = await notificationService.handleFraudAlert({
            claimId,
            fraudProbability: fraudProbability || 0,
            riskStatus: riskStatus || 'UNKNOWN',
            claimsManagerId,
        });

        console.log(`[EVENT] ✅ FRAUD_ALERT — Claim #${claimId} → Probability: ${fraudProbability}%`);

        return res.status(201).json({
            success: true,
            message: 'Fraud alert notification sent.',
            data: notification,
        });
    } catch (error) {
        console.error('[ERROR] fraudAlert:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to process fraud alert event.' });
    }
}

/**
 * POST /internal/events/payment-received
 * Called by Spring Boot when premium payment is successful
 * 
 * Body: { customerId, policyId, amount, paymentDate }
 */
async function paymentReceived(req, res) {
    try {
        const { customerId, policyId, amount, paymentDate } = req.body;

        if (!customerId || !policyId) {
            return res.status(400).json({ success: false, message: 'customerId and policyId are required.' });
        }

        const notification = await notificationService.handlePaymentReceived({
            customerId,
            policyId,
            amount: amount || 0,
            paymentDate,
        });

        console.log(`[EVENT] ✅ PAYMENT_RECEIVED — Policy #${policyId} → Customer ${customerId}`);

        return res.status(201).json({
            success: true,
            message: 'Payment notification sent.',
            data: notification,
        });
    } catch (error) {
        console.error('[ERROR] paymentReceived:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to process payment event.' });
    }
}

/**
 * POST /internal/events/claim-settled
 * Called by Spring Boot when claim settlement is completed
 * 
 * Body: { claimId, customerId, settlementAmount }
 */
async function claimSettled(req, res) {
    try {
        const { claimId, customerId, settlementAmount } = req.body;

        if (!claimId || !customerId) {
            return res.status(400).json({ success: false, message: 'claimId and customerId are required.' });
        }

        const notification = await notificationService.handleClaimSettled({
            claimId,
            customerId,
            settlementAmount: settlementAmount || 0,
        });

        console.log(`[EVENT] ✅ CLAIM_SETTLED — Claim #${claimId} → Customer ${customerId}`);

        return res.status(201).json({
            success: true,
            message: 'Claim settled notification sent.',
            data: notification,
        });
    } catch (error) {
        console.error('[ERROR] claimSettled:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to process claim settled event.' });
    }
}

/**
 * POST /internal/events/policy-renewal-due
 * Called by Spring Boot when a policy is approaching renewal date
 * 
 * Body: { policyId, customerId, agentId, daysRemaining }
 */
async function policyRenewalDue(req, res) {
    try {
        const { policyId, customerId, agentId, daysRemaining } = req.body;

        if (!policyId || !customerId) {
            return res.status(400).json({ success: false, message: 'policyId and customerId are required.' });
        }

        const notifications = await notificationService.handlePolicyRenewalDue({
            policyId,
            customerId,
            agentId,
            daysRemaining: daysRemaining || 30,
        });

        console.log(`[EVENT] ✅ POLICY_RENEWAL_DUE — Policy #${policyId} → ${daysRemaining} day(s) remaining`);

        return res.status(201).json({
            success: true,
            message: 'Policy renewal notification sent.',
            data: notifications,
        });
    } catch (error) {
        console.error('[ERROR] policyRenewalDue:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to process policy renewal event.' });
    }
}

module.exports = {
    claimFiled,
    claimStatusUpdated,
    fraudAlert,
    paymentReceived,
    claimSettled,
    policyRenewalDue,
};
