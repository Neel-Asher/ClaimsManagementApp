package com.insuranceiq.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum KycStatus {
    VERIFIED, PENDING, REJECTED;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static KycStatus fromValue(String value) {
        return valueOf(value.toUpperCase());
    }
}
