package com.insuranceiq.service;

import com.insuranceiq.dto.PolicyRequest;
import com.insuranceiq.dto.PolicyResponse;
import com.insuranceiq.exception.ResourceNotFoundException;
import com.insuranceiq.model.*;
import com.insuranceiq.model.enums.PolicyStatus;
import com.insuranceiq.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final CustomerRepository customerRepository;
    private final AgentRepository agentRepository;
    private final InsuranceProductRepository productRepository;

    public List<PolicyResponse> getAll() {
        return policyRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PolicyResponse getById(String id) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found: " + id));
        return toResponse(policy);
    }

    public PolicyResponse create(PolicyRequest request) {
        Policy policy = new Policy();
        policy.setPolicyId(generatePolicyId());
        mapRequestToEntity(request, policy);
        policy = policyRepository.save(policy);

        // Update agent metrics
        if (policy.getAgent() != null) {
            Agent agent = policy.getAgent();
            agent.setPoliciesSold(agent.getPoliciesSold() + 1);
            agent.setTotalPremium(agent.getTotalPremium() + (policy.getPremiumAmount() != null ? policy.getPremiumAmount() : 0));
            agentRepository.save(agent);
        }

        return toResponse(policy);
    }

    public PolicyResponse update(String id, PolicyRequest request) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found: " + id));
        mapRequestToEntity(request, policy);
        policy = policyRepository.save(policy);
        return toResponse(policy);
    }

    public void delete(String id) {
        if (!policyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Policy not found: " + id);
        }
        policyRepository.deleteById(id);
    }

    private String generatePolicyId() {
        long count = policyRepository.count() + 1;
        return String.format("POL-%d-%03d", LocalDate.now().getYear(), count);
    }

    private void mapRequestToEntity(PolicyRequest request, Policy policy) {
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + request.getCustomerId()));
            policy.setCustomer(customer);
        }
        if (request.getAgentId() != null) {
            Agent agent = agentRepository.findById(request.getAgentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Agent not found: " + request.getAgentId()));
            policy.setAgent(agent);
        }
        if (request.getProductId() != null) {
            InsuranceProduct product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.getProductId()));
            policy.setProduct(product);
        }
        if (request.getStartDate() != null) policy.setStartDate(LocalDate.parse(request.getStartDate()));
        if (request.getEndDate() != null) policy.setEndDate(LocalDate.parse(request.getEndDate()));
        if (request.getPremiumAmount() != null) policy.setPremiumAmount(request.getPremiumAmount());
        if (request.getStatus() != null) {
            policy.setStatus(PolicyStatus.fromValue(request.getStatus()));
        }
    }

    private PolicyResponse toResponse(Policy p) {
        return PolicyResponse.builder()
                .policyId(p.getPolicyId())
                .customerId(p.getCustomer() != null ? p.getCustomer().getCustomerId() : null)
                .customerName(p.getCustomer() != null ? p.getCustomer().getName() : null)
                .agentId(p.getAgent() != null ? p.getAgent().getAgentId() : null)
                .agentName(p.getAgent() != null ? p.getAgent().getName() : null)
                .productId(p.getProduct() != null ? p.getProduct().getProductId() : null)
                .productName(p.getProduct() != null ? p.getProduct().getName() : null)
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .premiumAmount(p.getPremiumAmount())
                .status(p.getStatus() != null ? p.getStatus().toValue() : null)
                .fraudRiskScore(p.getFraudRiskScore())
                .build();
    }
}
