package com.insuranceiq.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardSummary {
    private long totalPolicies;
    private long activePolicies;
    private long totalClaims;
    private long pendingClaims;
    private long approvedClaims;
    private long rejectedClaims;
    private double totalPremium;
    private long fraudAlerts;
}
