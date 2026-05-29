package com.insuranceiq.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "fraud_predictions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FraudPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prediction_id")
    private Long predictionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false)
    private Claim claim;

    @Column(name = "fraud_probability")
    private Integer fraudProbability;

    @Column(name = "risk_status")
    private String riskStatus;

    private String recommendation;

    @Column(name = "generated_at")
    private LocalDate generatedAt;

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) generatedAt = LocalDate.now();
    }
}
