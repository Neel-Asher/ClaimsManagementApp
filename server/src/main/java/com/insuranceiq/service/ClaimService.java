package com.insuranceiq.service;

import com.insuranceiq.dto.ClaimRequest;
import com.insuranceiq.dto.ClaimResponse;
import com.insuranceiq.exception.ResourceNotFoundException;
import com.insuranceiq.model.*;
import com.insuranceiq.model.enums.ClaimStatus;
import com.insuranceiq.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final PolicyRepository policyRepository;
    private final CustomerRepository customerRepository;
    private final NotificationService notificationService;

    public List<ClaimResponse> getAll() {
        return claimRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ClaimResponse getById(String id) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found: " + id));
        return toResponse(claim);
    }

    public ClaimResponse create(ClaimRequest request) {
        Claim claim = new Claim();
        claim.setClaimId(generateClaimId());
        mapRequestToEntity(request, claim);
        claim.setStatus(ClaimStatus.PENDING);
        claim.setFraudScore(0);
        claim.setCreatedAt(LocalDate.now());
        claim = claimRepository.save(claim);

        // Fire notification
        notificationService.sendEvent("claimFiled",
                "New claim " + claim.getClaimId() + " filed by " +
                (claim.getCustomer() != null ? claim.getCustomer().getName() : "Unknown"));

        return toResponse(claim);
    }

    public ClaimResponse update(String id, ClaimRequest request) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found: " + id));

        String previousStatus = claim.getStatus() != null ? claim.getStatus().toValue() : "";
        mapRequestToEntity(request, claim);
        claim = claimRepository.save(claim);

        // Fire notification on status change
        String newStatus = claim.getStatus() != null ? claim.getStatus().toValue() : "";
        if (!previousStatus.equals(newStatus)) {
            notificationService.sendEvent("claimStatusUpdated",
                    "Claim " + claim.getClaimId() + " status changed to " + newStatus);
        }

        return toResponse(claim);
    }

    public void delete(String id) {
        if (!claimRepository.existsById(id)) {
            throw new ResourceNotFoundException("Claim not found: " + id);
        }
        claimRepository.deleteById(id);
    }

    private String generateClaimId() {
        long count = claimRepository.count() + 1;
        return String.format("CLM-%d-%03d", LocalDate.now().getYear(), count);
    }

    private void mapRequestToEntity(ClaimRequest request, Claim claim) {
        if (request.getPolicyId() != null) {
            Policy policy = policyRepository.findById(request.getPolicyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Policy not found: " + request.getPolicyId()));
            claim.setPolicy(policy);
        }
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + request.getCustomerId()));
            claim.setCustomer(customer);
        }
        if (request.getClaimType() != null) claim.setClaimType(request.getClaimType());
        if (request.getIncidentDate() != null) claim.setIncidentDate(LocalDate.parse(request.getIncidentDate()));
        if (request.getClaimAmount() != null) claim.setClaimAmount(request.getClaimAmount());
        if (request.getDescription() != null) claim.setDescription(request.getDescription());
        if (request.getSurveyorId() != null) claim.setSurveyorId(request.getSurveyorId());
        if (request.getStatus() != null) {
            claim.setStatus(ClaimStatus.fromValue(request.getStatus()));
        }
    }

    private ClaimResponse toResponse(Claim c) {
        return ClaimResponse.builder()
                .claimId(c.getClaimId())
                .policyId(c.getPolicy() != null ? c.getPolicy().getPolicyId() : null)
                .customerId(c.getCustomer() != null ? c.getCustomer().getCustomerId() : null)
                .customerName(c.getCustomer() != null ? c.getCustomer().getName() : null)
                .claimType(c.getClaimType())
                .incidentDate(c.getIncidentDate())
                .claimAmount(c.getClaimAmount())
                .status(c.getStatus() != null ? c.getStatus().toValue() : null)
                .fraudScore(c.getFraudScore())
                .surveyorId(c.getSurveyorId())
                .description(c.getDescription())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
