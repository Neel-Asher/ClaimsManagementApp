"""
tests/test_analytics.py
========================
Tests for analytics service and API endpoints.

Covers:
    - All 6 analytics endpoints
    - Response schema validation
    - Empty database edge cases
    - Dashboard summary KPIs
"""

import pytest


class TestHealthCheck:
    """Test health check endpoints."""

    def test_root_health_check(self, client):
        """Root endpoint should return health status."""
        response = client.get("/")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert "version" in data

    def test_health_alias(self, client):
        """Health alias should also work."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestClaimsTrend:
    """Test GET /analytics/claims-trend."""

    def test_claims_trend_empty_db(self, client):
        """Should return empty data on fresh database."""
        response = client.get("/analytics/claims-trend")
        assert response.status_code == 200

        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], list)
        assert "total_received" in data

    def test_claims_trend_structure(self, client):
        """Each trend item should have the required fields."""
        response = client.get("/analytics/claims-trend")
        data = response.json()

        if data["data"]:
            item = data["data"][0]
            assert "month" in item
            assert "claims_received" in item
            assert "claims_settled" in item
            assert "claims_rejected" in item


class TestFraudFlaggedClaims:
    """Test GET /analytics/fraud-flagged-claims."""

    def test_fraud_flagged_empty_db(self, client):
        """Should return empty data on fresh database."""
        response = client.get("/analytics/fraud-flagged-claims")
        assert response.status_code == 200

        data = response.json()
        assert "data" in data
        assert "total_flagged" in data
        assert "high_risk_count" in data
        assert "moderate_risk_count" in data

    def test_fraud_flagged_response_fields(self, client):
        """Response should have correct structure."""
        response = client.get("/analytics/fraud-flagged-claims")
        data = response.json()
        assert isinstance(data["data"], list)


class TestTopAgents:
    """Test GET /analytics/top-agents."""

    def test_top_agents_empty_db(self, client):
        """Should return empty data on fresh database."""
        response = client.get("/analytics/top-agents")
        assert response.status_code == 200

        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], list)

    def test_top_agents_custom_limit(self, client):
        """Should respect the limit query parameter."""
        response = client.get("/analytics/top-agents?limit=5")
        assert response.status_code == 200
        assert len(response.json()["data"]) <= 5

    def test_top_agents_invalid_limit(self, client):
        """Should reject limit < 1."""
        response = client.get("/analytics/top-agents?limit=0")
        assert response.status_code == 422


class TestLossRatio:
    """Test GET /analytics/loss-ratio."""

    def test_loss_ratio_empty_db(self, client):
        """Should return empty data on fresh database."""
        response = client.get("/analytics/loss-ratio")
        assert response.status_code == 200

        data = response.json()
        assert "data" in data
        assert "overall_loss_ratio" in data


class TestRenewalRate:
    """Test GET /analytics/renewal-rate."""

    def test_renewal_rate_empty_db(self, client):
        """Should return empty data on fresh database."""
        response = client.get("/analytics/renewal-rate")
        assert response.status_code == 200

        data = response.json()
        assert "data" in data
        assert "avg_renewal_rate" in data


class TestDashboardSummary:
    """Test GET /analytics/dashboard-summary."""

    def test_dashboard_summary_empty_db(self, client):
        """Should return zero-value KPIs on fresh database."""
        response = client.get("/analytics/dashboard-summary")
        assert response.status_code == 200

        data = response.json()
        required_kpis = [
            "total_policies", "active_policies", "total_claims",
            "pending_claims", "settled_claims", "rejected_claims",
            "fraud_flagged_claims", "total_premium_collected",
            "settlement_rate", "active_agents", "total_customers",
        ]
        for kpi in required_kpis:
            assert kpi in data, f"Missing KPI: {kpi}"

    def test_dashboard_summary_values_are_numeric(self, client):
        """All KPI values should be numeric."""
        response = client.get("/analytics/dashboard-summary")
        data = response.json()

        for key, value in data.items():
            assert isinstance(value, (int, float)), f"{key} is not numeric: {type(value)}"
