package com.insuranceiq.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PolicyStatus {
    ACTIVE, EXPIRED, RENEWAL_DUE, CANCELLED, LAPSED;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static PolicyStatus fromValue(String value) {
        return valueOf(value.toUpperCase());
    }
}
