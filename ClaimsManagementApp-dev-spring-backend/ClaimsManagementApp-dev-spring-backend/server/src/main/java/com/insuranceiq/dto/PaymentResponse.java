package com.insuranceiq.dto;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentResponse {
    private Long paymentId;
    private String policyId;
    private String customerName;
    private Double amount;
    private LocalDate paymentDate;
    private String type;
    private String status;
}
