package com.insuranceiq.service;

import com.insuranceiq.dto.FraudPredictionResponse;
import com.insuranceiq.exception.ResourceNotFoundException;
import com.insuranceiq.model.Claim;
import com.insuranceiq.model.FraudPrediction;
import com.insuranceiq.repository.ClaimRepository;
import com.insuranceiq.repository.FraudPredictionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraudService {

    private final ClaimRepository claimRepository;
    private final FraudPredictionRepository fraudPredictionRepository;
    private final NotificationService notificationService;

    @Value("${app.fraud-service.url}")
    private String fraudServiceUrl;

    @SuppressWarnings("unchecked")
    public FraudPredictionResponse predictFraud(String claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found: " + claimId));

        Integer fraudProbability;
        String riskStatus;
        String recommendation;

        try {
            // Try calling external FastAPI ML service
            RestTemplate restTemplate = new RestTemplate();

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("claim_amount", claim.getClaimAmount());
            requestBody.put("days_since_policy_start", calculateDaysSincePolicyStart(claim));
            requestBody.put("claim_type", claim.getClaimType() != null ? claim.getClaimType().toLowerCase().replace(" ", "_") : "unknown");
            requestBody.put("previous_claims_count", claimRepository.countByCustomerCustomerId(
                    claim.getCustomer() != null ? claim.getCustomer().getCustomerId() : 0L));
            requestBody.put("customer_age", calculateCustomerAge(claim));

            Map<String, Object> response = restTemplate.postForObject(
                    fraudServiceUrl + "/predict/fraud", requestBody, Map.class);

            if (response != null) {
                fraudProbability = ((Number) response.get("fraud_probability")).intValue();
                riskStatus = (String) response.get("risk_status");
                recommendation = (String) response.get("recommendation");
            } else {
                throw new RuntimeException("Empty response from fraud service");
            }

        } catch (Exception e) {
            log.warn("FastAPI fraud service unavailable, using rule-based fallback: {}", e.getMessage());
            // Rule-based fallback
            Map<String, Object> fallback = ruleBased(claim);
            fraudProbability = (Integer) fallback.get("fraud_probability");
            riskStatus = (String) fallback.get("risk_status");
            recommendation = (String) fallback.get("recommendation");
        }

        // Update claim fraud score
        claim.setFraudScore(fraudProbability);
        claimRepository.save(claim);

        // Save prediction
        FraudPrediction prediction = FraudPrediction.builder()
                .claim(claim)
                .fraudProbability(fraudProbability)
                .riskStatus(riskStatus)
                .recommendation(recommendation)
                .generatedAt(LocalDate.now())
                .build();
        prediction = fraudPredictionRepository.save(prediction);

        // Notify
        notificationService.sendEvent("fraudScoreGenerated",
                "Fraud score " + fraudProbability + "% generated for " + claimId);

        return toResponse(prediction);
    }

    public List<FraudPredictionResponse> getAllPredictions() {
        return fraudPredictionRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<FraudPredictionResponse> getFlaggedPredictions() {
        return fraudPredictionRepository.findByFraudProbabilityGreaterThan(60).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Map<String, Object> ruleBased(Claim claim) {
        Map<String, Object> result = new HashMap<>();
        double amount = claim.getClaimAmount() != null ? claim.getClaimAmount() : 0;
        long daysSincePolicyStart = calculateDaysSincePolicyStart(claim);
        long previousClaims = claimRepository.countByCustomerCustomerId(
                claim.getCustomer() != null ? claim.getCustomer().getCustomerId() : 0L);

        if (amount > 200000 && daysSincePolicyStart < 30 && previousClaims > 3) {
            result.put("fraud_probability", 85);
            result.put("risk_status", "High Risk");
            result.put("recommendation", "Escalate to investigation unit immediately");
        } else if (amount > 50000 && daysSincePolicyStart < 180 && previousClaims >= 2) {
            result.put("fraud_probability", 55);
            result.put("risk_status", "Medium Risk");
            result.put("recommendation", "Request additional documents");
        } else {
            result.put("fraud_probability", 15);
            result.put("risk_status", "Low Risk");
            result.put("recommendation", "Proceed to settlement");
        }

        return result;
    }

    private long calculateDaysSincePolicyStart(Claim claim) {
        if (claim.getPolicy() != null && claim.getPolicy().getStartDate() != null && claim.getIncidentDate() != null) {
            return ChronoUnit.DAYS.between(claim.getPolicy().getStartDate(), claim.getIncidentDate());
        }
        return 365; // default safe value
    }

    private int calculateCustomerAge(Claim claim) {
        if (claim.getCustomer() != null && claim.getCustomer().getDob() != null) {
            return (int) ChronoUnit.YEARS.between(claim.getCustomer().getDob(), LocalDate.now());
        }
        return 30; // default
    }

    private FraudPredictionResponse toResponse(FraudPrediction p) {
        return FraudPredictionResponse.builder()
                .predictionId(p.getPredictionId())
                .claimId(p.getClaim() != null ? p.getClaim().getClaimId() : null)
                .fraudProbability(p.getFraudProbability())
                .riskStatus(p.getRiskStatus())
                .recommendation(p.getRecommendation())
                .generatedAt(p.getGeneratedAt() != null ? p.getGeneratedAt().toString() : null)
                .build();
    }
}
