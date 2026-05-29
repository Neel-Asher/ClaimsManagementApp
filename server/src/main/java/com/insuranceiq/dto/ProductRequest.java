package com.insuranceiq.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductRequest {
    private String name;
    private String type;
    private Double coverageAmount;
    private Double premiumRate;
    private Integer termMonths;
}
