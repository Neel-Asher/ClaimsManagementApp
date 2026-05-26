package com.insuranceiq.dto;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClaimResponse {
    private String claimId;
    private String policyId;
    private Long customerId;
    private String customerName;
    private String claimType;
    private LocalDate incidentDate;
    private Double claimAmount;
    private String status;
    private Integer fraudScore;
    private Long surveyorId;
    private String description;
    private LocalDate createdAt;
}
