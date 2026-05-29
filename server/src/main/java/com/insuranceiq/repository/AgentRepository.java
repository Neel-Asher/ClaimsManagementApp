package com.insuranceiq.repository;

import com.insuranceiq.model.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface AgentRepository extends JpaRepository<Agent, Long> {
    Optional<Agent> findByUserId(Long userId);
    List<Agent> findByRegion(String region);
    List<Agent> findByStatus(String status);
    Optional<Agent> findByLicenseNo(String licenseNo);
}
