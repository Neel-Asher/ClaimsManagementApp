package com.insuranceiq.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
    ADMIN, AGENT, CUSTOMER, CLAIMS_MANAGER;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static Role fromValue(String value) {
        return valueOf(value.toUpperCase());
    }
}
