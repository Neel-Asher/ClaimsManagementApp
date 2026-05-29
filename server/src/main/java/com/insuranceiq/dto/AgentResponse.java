package com.insuranceiq.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AgentResponse {
    private Long agentId;
    private Long userId;
    private String name;
    private String email;
    private String licenseNo;
    private String region;
    private Double commissionPct;
    private String status;
    private Integer policiesSold;
    private Double totalPremium;
}
