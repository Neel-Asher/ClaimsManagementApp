package com.insuranceiq.dto;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PolicyResponse {
    private String policyId;
    private Long customerId;
    private String customerName;
    private Long agentId;
    private String agentName;
    private Long productId;
    private String productName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double premiumAmount;
    private String status;
    private Integer fraudRiskScore;
}
