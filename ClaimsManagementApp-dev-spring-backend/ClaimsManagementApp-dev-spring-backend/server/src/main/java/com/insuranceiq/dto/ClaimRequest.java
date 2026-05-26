package com.insuranceiq.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ClaimRequest {
    private String policyId;
    private Long customerId;
    private String claimType;
    private String incidentDate;
    private Double claimAmount;
    private String description;
    private Long surveyorId;
    private String status;
}
