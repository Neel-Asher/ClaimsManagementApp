-- ============================================
-- InsuranceIQ Notification Service — Database Schema
-- ============================================

-- Step 1: Create the database
CREATE DATABASE IF NOT EXISTS insuranceiq_notifications;

-- Step 2: Use the database
USE insuranceiq_notifications;

-- Step 3: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    event_type VARCHAR(100) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- Sample Test Data (Optional)
-- ============================================

INSERT INTO notifications (user_id, title, message, event_type) VALUES
(1, 'Welcome to InsuranceIQ', 'Your account has been created successfully.', 'SYSTEM'),
(5, 'Claim Filed', 'New claim #1001 has been submitted for review.', 'CLAIM_FILED'),
(5, 'Policy Renewal Reminder', 'Your Motor Insurance policy #101 is due for renewal in 7 days.', 'POLICY_RENEWAL_DUE'),
(7, 'Fraud Alert', 'High fraud risk detected for Claim #1001 — Fraud Probability: 82%', 'FRAUD_ALERT'),
(5, 'Payment Received', 'Premium payment of ₹12,500 received for Policy #101.', 'PREMIUM_PAYMENT_RECEIVED');
