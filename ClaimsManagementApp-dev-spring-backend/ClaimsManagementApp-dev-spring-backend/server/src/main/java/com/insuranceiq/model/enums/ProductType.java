package com.insuranceiq.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ProductType {
    HEALTH, MOTOR, LIFE, PROPERTY;

    @JsonValue
    public String toValue() {
        // Title case to match frontend: "Health", "Motor", etc.
        return name().charAt(0) + name().substring(1).toLowerCase();
    }

    @JsonCreator
    public static ProductType fromValue(String value) {
        return valueOf(value.toUpperCase());
    }
}
