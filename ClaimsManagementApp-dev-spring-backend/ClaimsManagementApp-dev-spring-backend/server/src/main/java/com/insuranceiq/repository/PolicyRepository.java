package com.insuranceiq.repository;

import com.insuranceiq.model.Policy;
import com.insuranceiq.model.enums.PolicyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface PolicyRepository extends JpaRepository<Policy, String> {
    List<Policy> findByCustomerCustomerId(Long customerId);
    List<Policy> findByAgentAgentId(Long agentId);
    List<Policy> findByStatus(PolicyStatus status);
    long countByStatus(PolicyStatus status);

    @Query("SELECT COALESCE(SUM(p.premiumAmount), 0) FROM Policy p")
    Double sumAllPremiums();

    @Query("SELECT COALESCE(SUM(p.premiumAmount), 0) FROM Policy p WHERE p.agent.agentId = :agentId")
    Double sumPremiumsByAgent(Long agentId);

    long countByAgentAgentId(Long agentId);
}
