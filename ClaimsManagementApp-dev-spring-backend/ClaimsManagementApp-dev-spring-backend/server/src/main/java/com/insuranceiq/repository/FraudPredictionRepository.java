package com.insuranceiq.repository;

import com.insuranceiq.model.FraudPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FraudPredictionRepository extends JpaRepository<FraudPrediction, Long> {
    Optional<FraudPrediction> findByClaimClaimId(String claimId);
    List<FraudPrediction> findByFraudProbabilityGreaterThan(Integer threshold);
}
