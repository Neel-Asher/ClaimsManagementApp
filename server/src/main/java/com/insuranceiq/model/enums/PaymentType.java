package com.insuranceiq.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentType {
    PREMIUM, CLAIM_SETTLEMENT;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static PaymentType fromValue(String value) {
        return valueOf(value.toUpperCase());
    }
}
