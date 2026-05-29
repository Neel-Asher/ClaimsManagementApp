// Mock data for the Insurance Intelligence Platform

export const mockUsers = [
  { id: 1, name: 'Rajesh Kumar', email: 'admin@insuranceiq.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Priya Sharma', email: 'agent@insuranceiq.com', role: 'agent', status: 'active' },
  { id: 3, name: 'Amit Patel', email: 'customer@insuranceiq.com', role: 'customer', status: 'active' },
  { id: 4, name: 'Sneha Gupta', email: 'claims@insuranceiq.com', role: 'claims_manager', status: 'active' },
];

export const mockCustomers = [
  { customer_id: 1, user_id: 3, name: 'Amittt Patel', email: 'amit@email.com', phone: '+91-9876543210', dob: '1990-05-15', address: '123 MG Road, Mumbai', kyc_status: 'verified', agent_id: 1, created_at: '2024-01-10' },
  { customer_id: 2, user_id: 5, name: 'Neha Singh', email: 'neha@email.com', phone: '+91-9876543211', dob: '1985-08-22', address: '456 Brigade Road, Bangalore', kyc_status: 'verified', agent_id: 1, created_at: '2024-02-15' },
  { customer_id: 3, user_id: 6, name: 'Vikram Joshi', email: 'vikram@email.com', phone: '+91-9876543212', dob: '1992-03-10', address: '789 Anna Salai, Chennai', kyc_status: 'pending', agent_id: 2, created_at: '2024-03-20' },
  { customer_id: 4, user_id: 7, name: 'Ananya Reddy', email: 'ananya@email.com', phone: '+91-9876543213', dob: '1988-11-05', address: '321 Jubilee Hills, Hyderabad', kyc_status: 'verified', agent_id: 1, created_at: '2024-04-01' },
  { customer_id: 5, user_id: 8, name: 'Rohit Mehta', email: 'rohit@email.com', phone: '+91-9876543214', dob: '1995-07-18', address: '654 Connaught Place, Delhi', kyc_status: 'rejected', agent_id: 2, created_at: '2024-04-15' },
  { customer_id: 6, user_id: 9, name: 'Kavita Nair', email: 'kavita@email.com', phone: '+91-9876543215', dob: '1991-12-30', address: '987 Marine Drive, Kochi', kyc_status: 'verified', agent_id: 1, created_at: '2024-05-01' },
];

export const mockAgents = [
  { agent_id: 1, user_id: 2, name: 'Priya Sharma', email: 'priya@insuranceiq.com', license_no: 'AGT-2024-001', region: 'Mumbai', commission_pct: 12, status: 'active', policies_sold: 45, total_premium: 2250000 },
  { agent_id: 2, user_id: 10, name: 'Arjun Verma', email: 'arjun@insuranceiq.com', license_no: 'AGT-2024-002', region: 'Delhi', commission_pct: 10, status: 'active', policies_sold: 38, total_premium: 1900000 },
  { agent_id: 3, user_id: 11, name: 'Meera Iyer', email: 'meera@insuranceiq.com', license_no: 'AGT-2024-003', region: 'Bangalore', commission_pct: 11, status: 'active', policies_sold: 52, total_premium: 2800000 },
  { agent_id: 4, user_id: 12, name: 'Suresh Pillai', email: 'suresh@insuranceiq.com', license_no: 'AGT-2024-004', region: 'Chennai', commission_pct: 9, status: 'inactive', policies_sold: 20, total_premium: 950000 },
];

export const mockProducts = [
  { product_id: 1, name: 'HealthShield Gold', type: 'Health', coverage_amount: 500000, premium_rate: 12000, term_months: 12 },
  { product_id: 2, name: 'HealthShield Platinum', type: 'Health', coverage_amount: 1000000, premium_rate: 22000, term_months: 12 },
  { product_id: 3, name: 'MotorGuard Standard', type: 'Motor', coverage_amount: 300000, premium_rate: 8000, term_months: 12 },
  { product_id: 4, name: 'MotorGuard Premium', type: 'Motor', coverage_amount: 750000, premium_rate: 15000, term_months: 12 },
  { product_id: 5, name: 'LifeSecure Term', type: 'Life', coverage_amount: 5000000, premium_rate: 35000, term_months: 240 },
  { product_id: 6, name: 'LifeSecure Endowment', type: 'Life', coverage_amount: 2000000, premium_rate: 48000, term_months: 180 },
  { product_id: 7, name: 'PropertySafe Home', type: 'Property', coverage_amount: 2500000, premium_rate: 18000, term_months: 12 },
  { product_id: 8, name: 'PropertySafe Commercial', type: 'Property', coverage_amount: 10000000, premium_rate: 65000, term_months: 12 },
];

export const mockPolicies = [
  { policy_id: 'POL-2024-001', customer_id: 1, customer_name: 'Amit Patel', agent_id: 1, agent_name: 'Priya Sharma', product_id: 1, product_name: 'HealthShield Gold', start_date: '2024-01-15', end_date: '2025-01-15', premium_amount: 12000, status: 'active', fraud_risk_score: 5 },
  { policy_id: 'POL-2024-002', customer_id: 1, customer_name: 'Amit Patel', agent_id: 1, agent_name: 'Priya Sharma', product_id: 3, product_name: 'MotorGuard Standard', start_date: '2024-02-01', end_date: '2025-02-01', premium_amount: 8000, status: 'active', fraud_risk_score: 3 },
  { policy_id: 'POL-2024-003', customer_id: 2, customer_name: 'Neha Singh', agent_id: 1, agent_name: 'Priya Sharma', product_id: 5, product_name: 'LifeSecure Term', start_date: '2024-03-10', end_date: '2044-03-10', premium_amount: 35000, status: 'active', fraud_risk_score: 2 },
  { policy_id: 'POL-2024-004', customer_id: 3, customer_name: 'Vikram Joshi', agent_id: 2, agent_name: 'Arjun Verma', product_id: 2, product_name: 'HealthShield Platinum', start_date: '2024-04-01', end_date: '2025-04-01', premium_amount: 22000, status: 'active', fraud_risk_score: 8 },
  { policy_id: 'POL-2024-005', customer_id: 4, customer_name: 'Ananya Reddy', agent_id: 1, agent_name: 'Priya Sharma', product_id: 7, product_name: 'PropertySafe Home', start_date: '2024-05-01', end_date: '2025-05-01', premium_amount: 18000, status: 'active', fraud_risk_score: 4 },
  { policy_id: 'POL-2024-006', customer_id: 5, customer_name: 'Rohit Mehta', agent_id: 2, agent_name: 'Arjun Verma', product_id: 4, product_name: 'MotorGuard Premium', start_date: '2023-06-01', end_date: '2024-06-01', premium_amount: 15000, status: 'expired', fraud_risk_score: 15 },
  { policy_id: 'POL-2024-007', customer_id: 6, customer_name: 'Kavita Nair', agent_id: 1, agent_name: 'Priya Sharma', product_id: 6, product_name: 'LifeSecure Endowment', start_date: '2024-06-15', end_date: '2039-06-15', premium_amount: 48000, status: 'active', fraud_risk_score: 1 },
  { policy_id: 'POL-2024-008', customer_id: 2, customer_name: 'Neha Singh', agent_id: 1, agent_name: 'Priya Sharma', product_id: 8, product_name: 'PropertySafe Commercial', start_date: '2024-01-01', end_date: '2025-01-01', premium_amount: 65000, status: 'renewal_due', fraud_risk_score: 6 },
];

export const mockClaims = [
  { claim_id: 'CLM-2024-001', policy_id: 'POL-2024-001', customer_id: 1, customer_name: 'Amit Patel', claim_type: 'Health', incident_date: '2024-06-10', claim_amount: 45000, status: 'approved', fraud_score: 12, surveyor_id: null, description: 'Hospitalization for surgery', created_at: '2024-06-12' },
  { claim_id: 'CLM-2024-002', policy_id: 'POL-2024-002', customer_id: 1, customer_name: 'Amit Patel', claim_type: 'Motor', incident_date: '2024-07-05', claim_amount: 85000, status: 'pending', fraud_score: 35, surveyor_id: null, description: 'Accident damage - front bumper', created_at: '2024-07-06' },
  { claim_id: 'CLM-2024-003', policy_id: 'POL-2024-004', customer_id: 3, customer_name: 'Vikram Joshi', claim_type: 'Health', incident_date: '2024-07-15', claim_amount: 250000, status: 'under_review', fraud_score: 78, surveyor_id: 1, description: 'Multiple surgeries claimed', created_at: '2024-07-16' },
  { claim_id: 'CLM-2024-004', policy_id: 'POL-2024-005', customer_id: 4, customer_name: 'Ananya Reddy', claim_type: 'Property', incident_date: '2024-08-01', claim_amount: 350000, status: 'pending', fraud_score: 22, surveyor_id: null, description: 'Water damage due to pipe burst', created_at: '2024-08-02' },
  { claim_id: 'CLM-2024-005', policy_id: 'POL-2024-006', customer_id: 5, customer_name: 'Rohit Mehta', claim_type: 'Motor', incident_date: '2024-05-20', claim_amount: 180000, status: 'rejected', fraud_score: 85, surveyor_id: 2, description: 'Total vehicle loss - suspicious circumstances', created_at: '2024-05-22' },
  { claim_id: 'CLM-2024-006', policy_id: 'POL-2024-003', customer_id: 2, customer_name: 'Neha Singh', claim_type: 'Life', incident_date: '2024-08-10', claim_amount: 5000000, status: 'under_review', fraud_score: 15, surveyor_id: null, description: 'Critical illness benefit claim', created_at: '2024-08-11' },
  { claim_id: 'CLM-2024-007', policy_id: 'POL-2024-007', customer_id: 6, customer_name: 'Kavita Nair', claim_type: 'Life', incident_date: '2024-09-01', claim_amount: 100000, status: 'approved', fraud_score: 5, surveyor_id: null, description: 'Partial withdrawal request', created_at: '2024-09-02' },
  { claim_id: 'CLM-2024-008', policy_id: 'POL-2024-004', customer_id: 3, customer_name: 'Vikram Joshi', claim_type: 'Health', incident_date: '2024-09-15', claim_amount: 95000, status: 'pending', fraud_score: 62, surveyor_id: null, description: 'Emergency treatment claim', created_at: '2024-09-16' },
];

export const mockPayments = [
  { payment_id: 1, policy_id: 'POL-2024-001', customer_name: 'Amit Patel', amount: 12000, payment_date: '2024-01-15', type: 'premium', status: 'completed' },
  { payment_id: 2, policy_id: 'POL-2024-002', customer_name: 'Amit Patel', amount: 8000, payment_date: '2024-02-01', type: 'premium', status: 'completed' },
  { payment_id: 3, policy_id: 'POL-2024-003', customer_name: 'Neha Singh', amount: 35000, payment_date: '2024-03-10', type: 'premium', status: 'completed' },
  { payment_id: 4, policy_id: 'POL-2024-001', customer_name: 'Amit Patel', amount: 45000, payment_date: '2024-06-20', type: 'claim_settlement', status: 'completed' },
  { payment_id: 5, policy_id: 'POL-2024-004', customer_name: 'Vikram Joshi', amount: 22000, payment_date: '2024-04-01', type: 'premium', status: 'completed' },
  { payment_id: 6, policy_id: 'POL-2024-005', customer_name: 'Ananya Reddy', amount: 18000, payment_date: '2024-05-01', type: 'premium', status: 'completed' },
  { payment_id: 7, policy_id: 'POL-2024-007', customer_name: 'Kavita Nair', amount: 100000, payment_date: '2024-09-10', type: 'claim_settlement', status: 'completed' },
  { payment_id: 8, policy_id: 'POL-2024-008', customer_name: 'Neha Singh', amount: 65000, payment_date: '2025-01-01', type: 'premium', status: 'pending' },
];

export const mockFraudPredictions = [
  { prediction_id: 1, claim_id: 'CLM-2024-003', fraud_probability: 78, risk_status: 'High Risk', recommendation: 'Request additional documents and surveyor re-inspection', generated_at: '2024-07-16' },
  { prediction_id: 2, claim_id: 'CLM-2024-005', fraud_probability: 85, risk_status: 'High Risk', recommendation: 'Escalate to investigation unit immediately', generated_at: '2024-05-22' },
  { prediction_id: 3, claim_id: 'CLM-2024-008', fraud_probability: 62, risk_status: 'Medium Risk', recommendation: 'Request additional medical documents', generated_at: '2024-09-16' },
  { prediction_id: 4, claim_id: 'CLM-2024-002', fraud_probability: 35, risk_status: 'Low Risk', recommendation: 'Proceed with standard verification', generated_at: '2024-07-06' },
  { prediction_id: 5, claim_id: 'CLM-2024-004', fraud_probability: 22, risk_status: 'Low Risk', recommendation: 'Proceed to settlement', generated_at: '2024-08-02' },
  { prediction_id: 6, claim_id: 'CLM-2024-001', fraud_probability: 12, risk_status: 'Low Risk', recommendation: 'Auto-approve eligible', generated_at: '2024-06-12' },
];

export const mockNotifications = [
  { id: 1, type: 'claimFiled', message: 'New claim CLM-2024-008 filed by Vikram Joshi', time: '2 minutes ago', read: false },
  { id: 2, type: 'fraudScoreGenerated', message: 'Fraud score 78% detected for CLM-2024-003', time: '15 minutes ago', read: false },
  { id: 3, type: 'claimStatusUpdated', message: 'Claim CLM-2024-001 has been approved', time: '1 hour ago', read: false },
  { id: 4, type: 'policyRenewalDue', message: 'Policy POL-2024-008 renewal due in 7 days', time: '2 hours ago', read: true },
  { id: 5, type: 'claimStatusUpdated', message: 'Claim CLM-2024-005 has been rejected', time: '3 hours ago', read: true },
  { id: 6, type: 'claimFiled', message: 'New claim CLM-2024-007 filed by Kavita Nair', time: '5 hours ago', read: true },
  { id: 7, type: 'policyRenewalDue', message: 'Policy POL-2024-006 has expired', time: '1 day ago', read: true },
  { id: 8, type: 'fraudScoreGenerated', message: 'Fraud score 85% detected for CLM-2024-005', time: '2 days ago', read: true },
];

// Chart data for analytics
export const claimsTrendData = [
  { month: 'Jan', filed: 12, approved: 8, rejected: 2, settled: 6 },
  { month: 'Feb', filed: 15, approved: 10, rejected: 3, settled: 8 },
  { month: 'Mar', filed: 18, approved: 12, rejected: 4, settled: 10 },
  { month: 'Apr', filed: 22, approved: 14, rejected: 5, settled: 12 },
  { month: 'May', filed: 25, approved: 18, rejected: 3, settled: 15 },
  { month: 'Jun', filed: 20, approved: 15, rejected: 2, settled: 13 },
  { month: 'Jul', filed: 28, approved: 20, rejected: 4, settled: 17 },
  { month: 'Aug', filed: 32, approved: 22, rejected: 6, settled: 19 },
  { month: 'Sep', filed: 26, approved: 19, rejected: 3, settled: 16 },
];

export const fraudDistributionData = [
  { name: 'Low Risk', value: 45, fill: '#10b981' },
  { name: 'Medium Risk', value: 30, fill: '#f59e0b' },
  { name: 'High Risk', value: 25, fill: '#ef4444' },
];

export const topAgentsData = [
  { name: 'Meera Iyer', policies: 52, premium: 2800000 },
  { name: 'Priya Sharma', policies: 45, premium: 2250000 },
  { name: 'Arjun Verma', policies: 38, premium: 1900000 },
  { name: 'Suresh Pillai', policies: 20, premium: 950000 },
];

export const renewalTrendData = [
  { month: 'Jan', renewed: 20, lapsed: 5, due: 8 },
  { month: 'Feb', renewed: 25, lapsed: 3, due: 10 },
  { month: 'Mar', renewed: 18, lapsed: 7, due: 12 },
  { month: 'Apr', renewed: 30, lapsed: 4, due: 9 },
  { month: 'May', renewed: 28, lapsed: 6, due: 11 },
  { month: 'Jun', renewed: 35, lapsed: 2, due: 7 },
  { month: 'Jul', renewed: 22, lapsed: 8, due: 15 },
  { month: 'Aug', renewed: 32, lapsed: 3, due: 10 },
  { month: 'Sep', renewed: 27, lapsed: 5, due: 13 },
];

export const policyByTypeData = [
  { type: 'Health', count: 120, premium: 1800000 },
  { type: 'Motor', count: 95, premium: 1200000 },
  { type: 'Life', count: 60, premium: 2500000 },
  { type: 'Property', count: 45, premium: 950000 },
];

export const commissionData = [
  { month: 'Jan', earned: 28000, pending: 5000 },
  { month: 'Feb', earned: 32000, pending: 8000 },
  { month: 'Mar', earned: 25000, pending: 3000 },
  { month: 'Apr', earned: 40000, pending: 10000 },
  { month: 'May', earned: 38000, pending: 7000 },
  { month: 'Jun', earned: 45000, pending: 12000 },
];
