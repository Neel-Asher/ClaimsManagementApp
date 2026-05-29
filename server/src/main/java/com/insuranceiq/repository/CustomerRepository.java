package com.insuranceiq.repository;

import com.insuranceiq.model.Customer;
import com.insuranceiq.model.enums.KycStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByUserEmail(String email);
    Optional<Customer> findByUserId(Long userId);
    List<Customer> findByAgentAgentId(Long agentId);
    List<Customer> findByKycStatus(KycStatus kycStatus);
    List<Customer> findByNameContainingIgnoreCase(String name);
}
