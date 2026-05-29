package com.insuranceiq.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FraudPredictionResponse {
    private Long predictionId;
    private String claimId;
    private Integer fraudProbability;
    private String riskStatus;
    private String recommendation;
    private String generatedAt;
}
