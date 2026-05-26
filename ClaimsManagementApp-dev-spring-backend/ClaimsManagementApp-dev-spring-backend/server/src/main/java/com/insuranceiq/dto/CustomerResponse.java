package com.insuranceiq.dto;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomerResponse {
    private Long customerId;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private LocalDate dob;
    private String address;
    private String kycStatus;
    private Long agentId;
    private LocalDate createdAt;
}
