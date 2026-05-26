package com.insuranceiq.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CustomerRequest {
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String dob;
    private String address;
    private String kycStatus;
    private Long agentId;
}
