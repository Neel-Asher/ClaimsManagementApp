package com.insuranceiq.repository;

import com.insuranceiq.model.Claim;
import com.insuranceiq.model.enums.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, String> {
    List<Claim> findByCustomerCustomerId(Long customerId);
    List<Claim> findByPolicyPolicyId(String policyId);
    List<Claim> findByStatus(ClaimStatus status);
    long countByStatus(ClaimStatus status);
    List<Claim> findByFraudScoreGreaterThan(Integer threshold);

    @Query("SELECT COALESCE(SUM(c.claimAmount), 0) FROM Claim c WHERE c.status = 'SETTLED' OR c.status = 'APPROVED'")
    Double sumSettledClaimAmounts();

    long countByCustomerCustomerId(Long customerId);
}
