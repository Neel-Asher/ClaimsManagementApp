package com.insuranceiq.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AgentRequest {
    private Long userId;
    private String name;
    private String email;
    private String licenseNo;
    private String region;
    private Double commissionPct;
    private String status;
}
