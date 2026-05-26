package com.insuranceiq.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;
}
