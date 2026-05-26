"""
tests/test_fraud.py
====================
Tests for the fraud detection service and API endpoint.

Covers:
    - Rule-based fraud scoring (low, moderate, high risk)
    - API endpoint POST /predict/fraud/{claim_id}
    - Prediction history retrieval
    - Detection mode endpoint
    - Edge cases and boundary values
"""

import pytest


class TestRuleBasedFraudDetection:
    """Test the rule-based fraud scoring engine."""

    def test_low_risk_claim_returns_low_score(self, client, low_risk_claim):
        """Low-risk claim should score below 35%."""
        response = client.post("/predict/fraud/CLM-TEST-001", json=low_risk_claim)
        assert response.status_code == 200

        data = response.json()
        assert data["fraud_probability"] < 35
        assert "Low Risk" in data["risk_status"]
        assert data["claim_id"] == "CLM-TEST-001"
        assert data["detection_mode"] == "RULE_BASED"

    def test_moderate_risk_claim_returns_moderate_score(self, client, moderate_risk_claim):
        """Moderate-risk claim should score between 35-60%."""
        response = client.post("/predict/fraud/CLM-TEST-002", json=moderate_risk_claim)
        assert response.status_code == 200

        data = response.json()
        assert 35 <= data["fraud_probability"] <= 65
        assert "Moderate Risk" in data["risk_status"] or "High Risk" in data["risk_status"]

    def test_high_risk_claim_returns_high_score(self, client, high_risk_claim):
        """High-risk claim should score above 60%."""
        response = client.post("/predict/fraud/CLM-TEST-003", json=high_risk_claim)
        assert response.status_code == 200

        data = response.json()
        assert data["fraud_probability"] >= 60
        assert "High Risk" in data["risk_status"]
        assert "additional documents" in data["recommendation"].lower() or \
               "re-inspection" in data["recommendation"].lower()

    def test_response_contains_all_required_fields(self, client, low_risk_claim):
        """Response must contain all fields defined in the spec."""
        response = client.post("/predict/fraud/CLM-TEST-004", json=low_risk_claim)
        data = response.json()

        required_fields = [
            "claim_id", "fraud_probability", "risk_status",
            "recommendation", "detection_mode", "prediction_id",
            "generated_at",
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"

    def test_prediction_id_is_unique(self, client, low_risk_claim):
        """Each prediction should have a unique ID."""
        r1 = client.post("/predict/fraud/CLM-001", json=low_risk_claim)
        r2 = client.post("/predict/fraud/CLM-002", json=low_risk_claim)

        assert r1.json()["prediction_id"] != r2.json()["prediction_id"]


class TestFraudAPIEdgeCases:
    """Test edge cases and validation for the fraud API."""

    def test_zero_claim_amount_rejected(self, client):
        """Claim amount must be positive (> 0)."""
        payload = {
            "claim_amount": 0,
            "days_since_policy_start": 100,
            "claim_type": "health",
            "previous_claims_count": 1,
            "customer_age": 35,
        }
        response = client.post("/predict/fraud/CLM-EDGE-001", json=payload)
        assert response.status_code == 422  # Validation error

    def test_negative_age_rejected(self, client):
        """Customer age must be positive."""
        payload = {
            "claim_amount": 50000,
            "days_since_policy_start": 100,
            "claim_type": "health",
            "previous_claims_count": 1,
            "customer_age": -5,
        }
        response = client.post("/predict/fraud/CLM-EDGE-002", json=payload)
        assert response.status_code == 422

    def test_optional_fields_use_defaults(self, client):
        """Optional fields should use defaults when not provided."""
        payload = {
            "claim_amount": 50000,
            "days_since_policy_start": 200,
            "claim_type": "health",
            "previous_claims_count": 0,
            "customer_age": 40,
            # policy_premium_ratio and surveyor_mismatch_flag omitted
        }
        response = client.post("/predict/fraud/CLM-EDGE-003", json=payload)
        assert response.status_code == 200

    def test_very_large_claim_gets_high_score(self, client):
        """Extremely large claims should always be flagged."""
        payload = {
            "claim_amount": 5000000,  # ₹50 Lakh
            "days_since_policy_start": 5,
            "claim_type": "property_damage",
            "previous_claims_count": 6,
            "customer_age": 22,
            "surveyor_mismatch_flag": 1,
        }
        response = client.post("/predict/fraud/CLM-EXTREME", json=payload)
        data = response.json()

        assert data["fraud_probability"] >= 60
        assert "High Risk" in data["risk_status"]


class TestPredictionHistory:
    """Test prediction history retrieval."""

    def test_get_empty_history(self, client):
        """No history should return empty list."""
        response = client.get("/predict/fraud/history/CLM-NONEXISTENT")
        assert response.status_code == 200
        assert response.json() == []

    def test_history_after_prediction(self, client, low_risk_claim):
        """History should contain the prediction after making one."""
        # Make a prediction
        client.post("/predict/fraud/CLM-HIST-001", json=low_risk_claim)

        # Check history
        response = client.get("/predict/fraud/history/CLM-HIST-001")
        assert response.status_code == 200

        history = response.json()
        assert len(history) >= 1
        assert history[0]["claim_id"] == "CLM-HIST-001"


class TestDetectionMode:
    """Test detection mode endpoint."""

    def test_get_detection_mode(self, client):
        """Detection mode endpoint should return current configuration."""
        response = client.get("/predict/fraud/mode")
        assert response.status_code == 200

        data = response.json()
        assert "configured_mode" in data
        assert "active_mode" in data
        assert data["active_mode"] in ["RULE_BASED", "ML"]
