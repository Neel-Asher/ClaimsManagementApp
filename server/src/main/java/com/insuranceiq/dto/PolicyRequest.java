package com.insuranceiq.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PolicyRequest {
    private Long customerId;
    private Long agentId;
    private Long productId;
    private String startDate;
    private String endDate;
    private Double premiumAmount;
    private String status;
}
