package com.insuranceiq.controller;

import com.insuranceiq.dto.DashboardSummary;
import com.insuranceiq.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Dashboard and analytics endpoints")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard-summary")
    @Operation(summary = "Get dashboard summary statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER')")
    public ResponseEntity<DashboardSummary> getDashboardSummary() {
        return ResponseEntity.ok(analyticsService.getDashboardSummary());
    }

    @GetMapping("/top-agents")
    @Operation(summary = "Get top performing agents")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getTopAgents() {
        return ResponseEntity.ok(analyticsService.getTopAgents());
    }

    @GetMapping("/fraud-flagged-claims")
    @Operation(summary = "Get fraud-flagged claims")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getFraudFlaggedClaims() {
        return ResponseEntity.ok(analyticsService.getFraudFlaggedClaims());
    }

    @GetMapping("/claims-trend")
    @Operation(summary = "Get monthly claims trend")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getClaimsTrend() {
        return ResponseEntity.ok(analyticsService.getClaimsTrend());
    }

    @GetMapping("/loss-ratio")
    @Operation(summary = "Get loss ratio analysis")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER')")
    public ResponseEntity<Map<String, Object>> getLossRatio() {
        return ResponseEntity.ok(analyticsService.getLossRatio());
    }

    @GetMapping("/renewal-rate")
    @Operation(summary = "Get policy renewal rate")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER')")
    public ResponseEntity<Map<String, Object>> getRenewalRate() {
        return ResponseEntity.ok(analyticsService.getRenewalRate());
    }

    @GetMapping("/fraud-distribution")
    @Operation(summary = "Get fraud risk distribution")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getFraudDistribution() {
        return ResponseEntity.ok(analyticsService.getFraudDistribution());
    }

    @GetMapping("/policy-by-type")
    @Operation(summary = "Get policies by product type")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER', 'AGENT')")
    public ResponseEntity<List<Map<String, Object>>> getPolicyByType() {
        return ResponseEntity.ok(analyticsService.getPolicyByType());
    }

    @GetMapping("/renewal-trend")
    @Operation(summary = "Get policy renewal trend")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
    public ResponseEntity<List<Map<String, Object>>> getRenewalTrend() {
        return ResponseEntity.ok(analyticsService.getRenewalTrend());
    }

    @GetMapping("/commission-data")
    @Operation(summary = "Get agent commission data")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
    public ResponseEntity<List<Map<String, Object>>> getCommissionData() {
        return ResponseEntity.ok(analyticsService.getCommissionData());
    }
}
