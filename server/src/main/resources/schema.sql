-- InsuranceIQ Platform Database Schema
-- MySQL

-- Create database (run this manually if needed):
-- CREATE DATABASE insuranceiq_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active'
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    agent_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    license_no VARCHAR(100) UNIQUE,
    region VARCHAR(100),
    commission_pct DOUBLE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    policies_sold INTEGER DEFAULT 0,
    total_premium DOUBLE DEFAULT 0
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    customer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    dob DATE,
    address TEXT,
    kyc_status VARCHAR(50) DEFAULT 'PENDING',
    agent_id BIGINT REFERENCES agents(agent_id),
    created_at DATE DEFAULT (CURRENT_DATE)
);

-- Insurance Products table
CREATE TABLE IF NOT EXISTS insurance_products (
    product_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    coverage_amount DOUBLE,
    premium_rate DOUBLE,
    term_months INTEGER
);

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
    policy_id VARCHAR(50) PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(customer_id),
    agent_id BIGINT REFERENCES agents(agent_id),
    product_id BIGINT NOT NULL REFERENCES insurance_products(product_id),
    start_date DATE,
    end_date DATE,
    premium_amount DOUBLE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    fraud_risk_score INTEGER DEFAULT 0
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    claim_id VARCHAR(50) PRIMARY KEY,
    policy_id VARCHAR(50) NOT NULL REFERENCES policies(policy_id),
    customer_id BIGINT NOT NULL REFERENCES customers(customer_id),
    claim_type VARCHAR(100),
    incident_date DATE,
    claim_amount DOUBLE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    fraud_score INTEGER DEFAULT 0,
    surveyor_id BIGINT,
    description TEXT,
    created_at DATE DEFAULT (CURRENT_DATE)
);

-- Claim Documents table
CREATE TABLE IF NOT EXISTS claim_documents (
    doc_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id VARCHAR(50) NOT NULL REFERENCES claims(claim_id),
    doc_type VARCHAR(100),
    s3_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    policy_id VARCHAR(50) NOT NULL REFERENCES policies(policy_id),
    customer_name VARCHAR(255),
    amount DOUBLE NOT NULL,
    payment_date DATE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
);

-- Fraud Predictions table
CREATE TABLE IF NOT EXISTS fraud_predictions (
    prediction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id VARCHAR(50) NOT NULL REFERENCES claims(claim_id),
    fraud_probability INTEGER,
    risk_status VARCHAR(100),
    recommendation TEXT,
    generated_at DATE DEFAULT (CURRENT_DATE)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_policies_customer ON policies(customer_id);
CREATE INDEX IF NOT EXISTS idx_policies_agent ON policies(agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_claims_policy ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_customer ON claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_fraud_score ON claims(fraud_score);
CREATE INDEX IF NOT EXISTS idx_customers_agent ON customers(agent_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
