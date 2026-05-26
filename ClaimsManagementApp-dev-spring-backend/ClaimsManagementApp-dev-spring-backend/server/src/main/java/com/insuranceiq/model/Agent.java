package com.insuranceiq.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Agent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "agent_id")
    private Long agentId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String name;

    private String email;

    @Column(name = "license_no", unique = true)
    private String licenseNo;

    private String region;

    @Column(name = "commission_pct")
    private Double commissionPct;

    @Column(nullable = false)
    private String status = "active";

    @Column(name = "policies_sold")
    private Integer policiesSold = 0;

    @Column(name = "total_premium")
    private Double totalPremium = 0.0;
}
