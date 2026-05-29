package com.insuranceiq.model;

import com.insuranceiq.model.enums.ProductType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "insurance_products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InsuranceProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long productId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductType type;

    @Column(name = "coverage_amount")
    private Double coverageAmount;

    @Column(name = "premium_rate")
    private Double premiumRate;

    @Column(name = "term_months")
    private Integer termMonths;
}
