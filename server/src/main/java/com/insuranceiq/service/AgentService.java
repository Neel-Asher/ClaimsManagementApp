package com.insuranceiq.service;

import com.insuranceiq.dto.AgentRequest;
import com.insuranceiq.dto.AgentResponse;
import com.insuranceiq.exception.ResourceNotFoundException;
import com.insuranceiq.model.Agent;
import com.insuranceiq.model.User;
import com.insuranceiq.repository.AgentRepository;
import com.insuranceiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgentService {

    private final AgentRepository agentRepository;
    private final UserRepository userRepository;

    public List<AgentResponse> getAll() {
        return agentRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public AgentResponse getById(Long id) {
        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found: " + id));
        return toResponse(agent);
    }

    public AgentResponse create(AgentRequest request) {
        Agent agent = new Agent();
        mapRequestToEntity(request, agent);
        agent = agentRepository.save(agent);
        return toResponse(agent);
    }

    public AgentResponse update(Long id, AgentRequest request) {
        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found: " + id));
        mapRequestToEntity(request, agent);
        agent = agentRepository.save(agent);
        return toResponse(agent);
    }

    private void mapRequestToEntity(AgentRequest request, Agent agent) {
        agent.setName(request.getName());
        agent.setEmail(request.getEmail());
        agent.setLicenseNo(request.getLicenseNo());
        agent.setRegion(request.getRegion());
        if (request.getCommissionPct() != null) agent.setCommissionPct(request.getCommissionPct());
        if (request.getStatus() != null) agent.setStatus(request.getStatus());
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUserId()));
            agent.setUser(user);
        }
    }

    private AgentResponse toResponse(Agent a) {
        return AgentResponse.builder()
                .agentId(a.getAgentId())
                .userId(a.getUser() != null ? a.getUser().getId() : null)
                .name(a.getName())
                .email(a.getEmail())
                .licenseNo(a.getLicenseNo())
                .region(a.getRegion())
                .commissionPct(a.getCommissionPct())
                .status(a.getStatus())
                .policiesSold(a.getPoliciesSold())
                .totalPremium(a.getTotalPremium())
                .build();
    }
}
