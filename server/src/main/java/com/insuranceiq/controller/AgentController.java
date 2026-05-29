package com.insuranceiq.controller;

import com.insuranceiq.dto.AgentRequest;
import com.insuranceiq.dto.AgentResponse;
import com.insuranceiq.service.AgentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
@Tag(name = "Agents", description = "Agent management endpoints")
public class AgentController {

    private final AgentService agentService;

    @GetMapping
    @Operation(summary = "Get all agents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AgentResponse>> getAll() {
        return ResponseEntity.ok(agentService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get agent by ID")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
    public ResponseEntity<AgentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(agentService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new agent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentResponse> create(@RequestBody AgentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(agentService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update agent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentResponse> update(@PathVariable Long id, @RequestBody AgentRequest request) {
        return ResponseEntity.ok(agentService.update(id, request));
    }
}
