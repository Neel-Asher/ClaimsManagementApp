package com.insuranceiq.controller;

import com.insuranceiq.dto.FraudPredictionResponse;
import com.insuranceiq.service.FraudService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/predict")
@RequiredArgsConstructor
@Tag(name = "Fraud Prediction", description = "AI fraud detection endpoints")
public class FraudController {

    private final FraudService fraudService;

    @PostMapping("/fraud/{claimId}")
    @Operation(summary = "Run fraud prediction on a claim")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER')")
    public ResponseEntity<FraudPredictionResponse> predictFraud(@PathVariable String claimId) {
        return ResponseEntity.ok(fraudService.predictFraud(claimId));
    }

    @GetMapping("/fraud/all")
    @Operation(summary = "Get all fraud predictions")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER')")
    public ResponseEntity<List<FraudPredictionResponse>> getAllPredictions() {
        return ResponseEntity.ok(fraudService.getAllPredictions());
    }

    @GetMapping("/fraud/flagged")
    @Operation(summary = "Get flagged fraud predictions (>60%)")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER')")
    public ResponseEntity<List<FraudPredictionResponse>> getFlaggedPredictions() {
        return ResponseEntity.ok(fraudService.getFlaggedPredictions());
    }
}
