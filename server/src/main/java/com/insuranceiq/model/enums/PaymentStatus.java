package com.insuranceiq.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentStatus {
    COMPLETED, PENDING, FAILED;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static PaymentStatus fromValue(String value) {
        return valueOf(value.toUpperCase());
    }
}
