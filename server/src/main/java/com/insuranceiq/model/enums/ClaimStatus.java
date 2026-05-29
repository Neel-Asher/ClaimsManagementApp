package com.insuranceiq.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ClaimStatus {
    PENDING, UNDER_REVIEW, APPROVED, REJECTED, SETTLED, CLOSED;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ClaimStatus fromValue(String value) {
        return valueOf(value.toUpperCase());
    }
}
