package com.insuranceiq.util;

import com.insuranceiq.model.*;
import com.insuranceiq.model.enums.*;
import com.insuranceiq.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final AgentRepository agentRepository;
    private final InsuranceProductRepository productRepository;
    private final PolicyRepository policyRepository;
    private final ClaimRepository claimRepository;
    private final PaymentRepository paymentRepository;
    private final FraudPredictionRepository fraudPredictionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded, skipping.");
            return;
        }

        log.info("Seeding database with demo data...");
        seedAll();
        log.info("Database seeding complete!");
    }

    private void seedAll() {
        String hashedPassword = passwordEncoder.encode("password123");

        // ===== Users (matching mockUsers) =====
        User admin = userRepository.save(User.builder()
                .name("Rajesh Kumar").email("admin@insuranceiq.com")
                .passwordHash(hashedPassword).role(Role.ADMIN).status("active").build());

        User agentUser = userRepository.save(User.builder()
                .name("Priya Sharma").email("agent@insuranceiq.com")
                .passwordHash(hashedPassword).role(Role.AGENT).status("active").build());

        User customerUser = userRepository.save(User.builder()
                .name("Amit Patel").email("customer@insuranceiq.com")
                .passwordHash(hashedPassword).role(Role.CUSTOMER).status("active").build());

        User claimsManager = userRepository.save(User.builder()
                .name("Sneha Gupta").email("claims@insuranceiq.com")
                .passwordHash(hashedPassword).role(Role.CLAIMS_MANAGER).status("active").build());

        // Additional users for customers and agents
        User u5 = userRepository.save(User.builder().name("Neha Singh").email("neha@email.com").passwordHash(hashedPassword).role(Role.CUSTOMER).status("active").build());
        User u6 = userRepository.save(User.builder().name("Vikram Joshi").email("vikram@email.com").passwordHash(hashedPassword).role(Role.CUSTOMER).status("active").build());
        User u7 = userRepository.save(User.builder().name("Ananya Reddy").email("ananya@email.com").passwordHash(hashedPassword).role(Role.CUSTOMER).status("active").build());
        User u8 = userRepository.save(User.builder().name("Rohit Mehta").email("rohit@email.com").passwordHash(hashedPassword).role(Role.CUSTOMER).status("active").build());
        User u9 = userRepository.save(User.builder().name("Kavita Nair").email("kavita@email.com").passwordHash(hashedPassword).role(Role.CUSTOMER).status("active").build());
        User u10 = userRepository.save(User.builder().name("Arjun Verma").email("arjun@insuranceiq.com").passwordHash(hashedPassword).role(Role.AGENT).status("active").build());
        User u11 = userRepository.save(User.builder().name("Meera Iyer").email("meera@insuranceiq.com").passwordHash(hashedPassword).role(Role.AGENT).status("active").build());
        User u12 = userRepository.save(User.builder().name("Suresh Pillai").email("suresh@insuranceiq.com").passwordHash(hashedPassword).role(Role.AGENT).status("active").build());

        // ===== Agents (matching mockAgents) =====
        Agent agent1 = agentRepository.save(Agent.builder()
                .user(agentUser).name("Priya Sharma").email("priya@insuranceiq.com")
                .licenseNo("AGT-2024-001").region("Mumbai").commissionPct(12.0)
                .status("active").policiesSold(45).totalPremium(2250000.0).build());

        Agent agent2 = agentRepository.save(Agent.builder()
                .user(u10).name("Arjun Verma").email("arjun@insuranceiq.com")
                .licenseNo("AGT-2024-002").region("Delhi").commissionPct(10.0)
                .status("active").policiesSold(38).totalPremium(1900000.0).build());

        Agent agent3 = agentRepository.save(Agent.builder()
                .user(u11).name("Meera Iyer").email("meera@insuranceiq.com")
                .licenseNo("AGT-2024-003").region("Bangalore").commissionPct(11.0)
                .status("active").policiesSold(52).totalPremium(2800000.0).build());

        Agent agent4 = agentRepository.save(Agent.builder()
                .user(u12).name("Suresh Pillai").email("suresh@insuranceiq.com")
                .licenseNo("AGT-2024-004").region("Chennai").commissionPct(9.0)
                .status("inactive").policiesSold(20).totalPremium(950000.0).build());

        // ===== Customers (matching mockCustomers) =====
        Customer c1 = customerRepository.save(Customer.builder()
                .user(customerUser).name("Amit Patel").email("amit@email.com").phone("+91-9876543210")
                .dob(LocalDate.of(1990, 5, 15)).address("123 MG Road, Mumbai")
                .kycStatus(KycStatus.VERIFIED).agent(agent1).createdAt(LocalDate.of(2024, 1, 10)).build());

        Customer c2 = customerRepository.save(Customer.builder()
                .user(u5).name("Neha Singh").email("neha@email.com").phone("+91-9876543211")
                .dob(LocalDate.of(1985, 8, 22)).address("456 Brigade Road, Bangalore")
                .kycStatus(KycStatus.VERIFIED).agent(agent1).createdAt(LocalDate.of(2024, 2, 15)).build());

        Customer c3 = customerRepository.save(Customer.builder()
                .user(u6).name("Vikram Joshi").email("vikram@email.com").phone("+91-9876543212")
                .dob(LocalDate.of(1992, 3, 10)).address("789 Anna Salai, Chennai")
                .kycStatus(KycStatus.PENDING).agent(agent2).createdAt(LocalDate.of(2024, 3, 20)).build());

        Customer c4 = customerRepository.save(Customer.builder()
                .user(u7).name("Ananya Reddy").email("ananya@email.com").phone("+91-9876543213")
                .dob(LocalDate.of(1988, 11, 5)).address("321 Jubilee Hills, Hyderabad")
                .kycStatus(KycStatus.VERIFIED).agent(agent1).createdAt(LocalDate.of(2024, 4, 1)).build());

        Customer c5 = customerRepository.save(Customer.builder()
                .user(u8).name("Rohit Mehta").email("rohit@email.com").phone("+91-9876543214")
                .dob(LocalDate.of(1995, 7, 18)).address("654 Connaught Place, Delhi")
                .kycStatus(KycStatus.REJECTED).agent(agent2).createdAt(LocalDate.of(2024, 4, 15)).build());

        Customer c6 = customerRepository.save(Customer.builder()
                .user(u9).name("Kavita Nair").email("kavita@email.com").phone("+91-9876543215")
                .dob(LocalDate.of(1991, 12, 30)).address("987 Marine Drive, Kochi")
                .kycStatus(KycStatus.VERIFIED).agent(agent1).createdAt(LocalDate.of(2024, 5, 1)).build());

        // ===== Insurance Products (matching mockProducts) =====
        InsuranceProduct p1 = productRepository.save(InsuranceProduct.builder().name("HealthShield Gold").type(ProductType.HEALTH).coverageAmount(500000.0).premiumRate(12000.0).termMonths(12).build());
        InsuranceProduct p2 = productRepository.save(InsuranceProduct.builder().name("HealthShield Platinum").type(ProductType.HEALTH).coverageAmount(1000000.0).premiumRate(22000.0).termMonths(12).build());
        InsuranceProduct p3 = productRepository.save(InsuranceProduct.builder().name("MotorGuard Standard").type(ProductType.MOTOR).coverageAmount(300000.0).premiumRate(8000.0).termMonths(12).build());
        InsuranceProduct p4 = productRepository.save(InsuranceProduct.builder().name("MotorGuard Premium").type(ProductType.MOTOR).coverageAmount(750000.0).premiumRate(15000.0).termMonths(12).build());
        InsuranceProduct p5 = productRepository.save(InsuranceProduct.builder().name("LifeSecure Term").type(ProductType.LIFE).coverageAmount(5000000.0).premiumRate(35000.0).termMonths(240).build());
        InsuranceProduct p6 = productRepository.save(InsuranceProduct.builder().name("LifeSecure Endowment").type(ProductType.LIFE).coverageAmount(2000000.0).premiumRate(48000.0).termMonths(180).build());
        InsuranceProduct p7 = productRepository.save(InsuranceProduct.builder().name("PropertySafe Home").type(ProductType.PROPERTY).coverageAmount(2500000.0).premiumRate(18000.0).termMonths(12).build());
        InsuranceProduct p8 = productRepository.save(InsuranceProduct.builder().name("PropertySafe Commercial").type(ProductType.PROPERTY).coverageAmount(10000000.0).premiumRate(65000.0).termMonths(12).build());

        // ===== Policies (matching mockPolicies) =====
        Policy pol1 = policyRepository.save(Policy.builder().policyId("POL-2024-001").customer(c1).agent(agent1).product(p1).startDate(LocalDate.of(2024,1,15)).endDate(LocalDate.of(2025,1,15)).premiumAmount(12000.0).status(PolicyStatus.ACTIVE).fraudRiskScore(5).build());
        Policy pol2 = policyRepository.save(Policy.builder().policyId("POL-2024-002").customer(c1).agent(agent1).product(p3).startDate(LocalDate.of(2024,2,1)).endDate(LocalDate.of(2025,2,1)).premiumAmount(8000.0).status(PolicyStatus.ACTIVE).fraudRiskScore(3).build());
        Policy pol3 = policyRepository.save(Policy.builder().policyId("POL-2024-003").customer(c2).agent(agent1).product(p5).startDate(LocalDate.of(2024,3,10)).endDate(LocalDate.of(2044,3,10)).premiumAmount(35000.0).status(PolicyStatus.ACTIVE).fraudRiskScore(2).build());
        Policy pol4 = policyRepository.save(Policy.builder().policyId("POL-2024-004").customer(c3).agent(agent2).product(p2).startDate(LocalDate.of(2024,4,1)).endDate(LocalDate.of(2025,4,1)).premiumAmount(22000.0).status(PolicyStatus.ACTIVE).fraudRiskScore(8).build());
        Policy pol5 = policyRepository.save(Policy.builder().policyId("POL-2024-005").customer(c4).agent(agent1).product(p7).startDate(LocalDate.of(2024,5,1)).endDate(LocalDate.of(2025,5,1)).premiumAmount(18000.0).status(PolicyStatus.ACTIVE).fraudRiskScore(4).build());
        Policy pol6 = policyRepository.save(Policy.builder().policyId("POL-2024-006").customer(c5).agent(agent2).product(p4).startDate(LocalDate.of(2023,6,1)).endDate(LocalDate.of(2024,6,1)).premiumAmount(15000.0).status(PolicyStatus.EXPIRED).fraudRiskScore(15).build());
        Policy pol7 = policyRepository.save(Policy.builder().policyId("POL-2024-007").customer(c6).agent(agent1).product(p6).startDate(LocalDate.of(2024,6,15)).endDate(LocalDate.of(2039,6,15)).premiumAmount(48000.0).status(PolicyStatus.ACTIVE).fraudRiskScore(1).build());
        Policy pol8 = policyRepository.save(Policy.builder().policyId("POL-2024-008").customer(c2).agent(agent1).product(p8).startDate(LocalDate.of(2024,1,1)).endDate(LocalDate.of(2025,1,1)).premiumAmount(65000.0).status(PolicyStatus.RENEWAL_DUE).fraudRiskScore(6).build());

        // ===== Claims (matching mockClaims) =====
        Claim clm1 = claimRepository.save(Claim.builder().claimId("CLM-2024-001").policy(pol1).customer(c1).claimType("Health").incidentDate(LocalDate.of(2024,6,10)).claimAmount(45000.0).status(ClaimStatus.APPROVED).fraudScore(12).description("Hospitalization for surgery").createdAt(LocalDate.of(2024,6,12)).build());
        Claim clm2 = claimRepository.save(Claim.builder().claimId("CLM-2024-002").policy(pol2).customer(c1).claimType("Motor").incidentDate(LocalDate.of(2024,7,5)).claimAmount(85000.0).status(ClaimStatus.PENDING).fraudScore(35).description("Accident damage - front bumper").createdAt(LocalDate.of(2024,7,6)).build());
        Claim clm3 = claimRepository.save(Claim.builder().claimId("CLM-2024-003").policy(pol4).customer(c3).claimType("Health").incidentDate(LocalDate.of(2024,7,15)).claimAmount(250000.0).status(ClaimStatus.UNDER_REVIEW).fraudScore(78).surveyorId(1L).description("Multiple surgeries claimed").createdAt(LocalDate.of(2024,7,16)).build());
        Claim clm4 = claimRepository.save(Claim.builder().claimId("CLM-2024-004").policy(pol5).customer(c4).claimType("Property").incidentDate(LocalDate.of(2024,8,1)).claimAmount(350000.0).status(ClaimStatus.PENDING).fraudScore(22).description("Water damage due to pipe burst").createdAt(LocalDate.of(2024,8,2)).build());
        Claim clm5 = claimRepository.save(Claim.builder().claimId("CLM-2024-005").policy(pol6).customer(c5).claimType("Motor").incidentDate(LocalDate.of(2024,5,20)).claimAmount(180000.0).status(ClaimStatus.REJECTED).fraudScore(85).surveyorId(2L).description("Total vehicle loss - suspicious circumstances").createdAt(LocalDate.of(2024,5,22)).build());
        Claim clm6 = claimRepository.save(Claim.builder().claimId("CLM-2024-006").policy(pol3).customer(c2).claimType("Life").incidentDate(LocalDate.of(2024,8,10)).claimAmount(5000000.0).status(ClaimStatus.UNDER_REVIEW).fraudScore(15).description("Critical illness benefit claim").createdAt(LocalDate.of(2024,8,11)).build());
        Claim clm7 = claimRepository.save(Claim.builder().claimId("CLM-2024-007").policy(pol7).customer(c6).claimType("Life").incidentDate(LocalDate.of(2024,9,1)).claimAmount(100000.0).status(ClaimStatus.APPROVED).fraudScore(5).description("Partial withdrawal request").createdAt(LocalDate.of(2024,9,2)).build());
        Claim clm8 = claimRepository.save(Claim.builder().claimId("CLM-2024-008").policy(pol4).customer(c3).claimType("Health").incidentDate(LocalDate.of(2024,9,15)).claimAmount(95000.0).status(ClaimStatus.PENDING).fraudScore(62).description("Emergency treatment claim").createdAt(LocalDate.of(2024,9,16)).build());

        // ===== Payments (matching mockPayments) =====
        paymentRepository.save(Payment.builder().policy(pol1).customerName("Amit Patel").amount(12000.0).paymentDate(LocalDate.of(2024,1,15)).type(PaymentType.PREMIUM).status(PaymentStatus.COMPLETED).build());
        paymentRepository.save(Payment.builder().policy(pol2).customerName("Amit Patel").amount(8000.0).paymentDate(LocalDate.of(2024,2,1)).type(PaymentType.PREMIUM).status(PaymentStatus.COMPLETED).build());
        paymentRepository.save(Payment.builder().policy(pol3).customerName("Neha Singh").amount(35000.0).paymentDate(LocalDate.of(2024,3,10)).type(PaymentType.PREMIUM).status(PaymentStatus.COMPLETED).build());
        paymentRepository.save(Payment.builder().policy(pol1).customerName("Amit Patel").amount(45000.0).paymentDate(LocalDate.of(2024,6,20)).type(PaymentType.CLAIM_SETTLEMENT).status(PaymentStatus.COMPLETED).build());
        paymentRepository.save(Payment.builder().policy(pol4).customerName("Vikram Joshi").amount(22000.0).paymentDate(LocalDate.of(2024,4,1)).type(PaymentType.PREMIUM).status(PaymentStatus.COMPLETED).build());
        paymentRepository.save(Payment.builder().policy(pol5).customerName("Ananya Reddy").amount(18000.0).paymentDate(LocalDate.of(2024,5,1)).type(PaymentType.PREMIUM).status(PaymentStatus.COMPLETED).build());
        paymentRepository.save(Payment.builder().policy(pol7).customerName("Kavita Nair").amount(100000.0).paymentDate(LocalDate.of(2024,9,10)).type(PaymentType.CLAIM_SETTLEMENT).status(PaymentStatus.COMPLETED).build());
        paymentRepository.save(Payment.builder().policy(pol8).customerName("Neha Singh").amount(65000.0).paymentDate(LocalDate.of(2025,1,1)).type(PaymentType.PREMIUM).status(PaymentStatus.PENDING).build());

        // ===== Fraud Predictions (matching mockFraudPredictions) =====
        fraudPredictionRepository.save(FraudPrediction.builder().claim(clm3).fraudProbability(78).riskStatus("High Risk").recommendation("Request additional documents and surveyor re-inspection").generatedAt(LocalDate.of(2024,7,16)).build());
        fraudPredictionRepository.save(FraudPrediction.builder().claim(clm5).fraudProbability(85).riskStatus("High Risk").recommendation("Escalate to investigation unit immediately").generatedAt(LocalDate.of(2024,5,22)).build());
        fraudPredictionRepository.save(FraudPrediction.builder().claim(clm8).fraudProbability(62).riskStatus("Medium Risk").recommendation("Request additional medical documents").generatedAt(LocalDate.of(2024,9,16)).build());
        fraudPredictionRepository.save(FraudPrediction.builder().claim(clm2).fraudProbability(35).riskStatus("Low Risk").recommendation("Proceed with standard verification").generatedAt(LocalDate.of(2024,7,6)).build());
        fraudPredictionRepository.save(FraudPrediction.builder().claim(clm4).fraudProbability(22).riskStatus("Low Risk").recommendation("Proceed to settlement").generatedAt(LocalDate.of(2024,8,2)).build());
        fraudPredictionRepository.save(FraudPrediction.builder().claim(clm1).fraudProbability(12).riskStatus("Low Risk").recommendation("Auto-approve eligible").generatedAt(LocalDate.of(2024,6,12)).build());

        log.info("Seeded: {} users, {} agents, {} customers, {} products, {} policies, {} claims, {} payments, {} fraud predictions",
                userRepository.count(), agentRepository.count(), customerRepository.count(),
                productRepository.count(), policyRepository.count(), claimRepository.count(),
                paymentRepository.count(), fraudPredictionRepository.count());
    }
}
