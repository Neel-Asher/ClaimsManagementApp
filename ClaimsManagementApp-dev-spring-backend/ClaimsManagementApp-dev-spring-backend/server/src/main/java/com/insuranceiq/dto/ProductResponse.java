package com.insuranceiq.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductResponse {
    private Long productId;
    private String name;
    private String type;
    private Double coverageAmount;
    private Double premiumRate;
    private Integer termMonths;
}
