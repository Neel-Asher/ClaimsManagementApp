package com.insuranceiq.controller;

import com.insuranceiq.dto.ClaimRequest;
import com.insuranceiq.dto.ClaimResponse;
import com.insuranceiq.service.ClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
@Tag(name = "Claims", description = "Claims management endpoints")
public class ClaimController {

    private final ClaimService claimService;

    @GetMapping
    @Operation(summary = "Get all claims")
    public ResponseEntity<List<ClaimResponse>> getAll() {
        return ResponseEntity.ok(claimService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get claim by ID")
    public ResponseEntity<ClaimResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(claimService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Submit a new claim")
    public ResponseEntity<ClaimResponse> create(@RequestBody ClaimRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(claimService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update claim (status, surveyor, etc.)")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER', 'AGENT')")
    public ResponseEntity<ClaimResponse> update(@PathVariable String id, @RequestBody ClaimRequest request) {
        return ResponseEntity.ok(claimService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete claim")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLAIMS_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        claimService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
