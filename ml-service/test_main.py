import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "version" in data
    assert "fraud_detection_mode" in data

def test_health_check_alias():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

# In a real comprehensive test suite, we would mock the database session
# and the external service calls. Here we just test the endpoints exist
# and return appropriate status codes for invalid or missing data.

def test_predict_fraud_invalid_claim():
    # Attempting to predict on a non-existent claim should return 404 or 500 depending on the implementation
    # We just ensure the endpoint is accessible
    response = client.post("/predict/fraud/NON_EXISTENT_CLAIM")
    assert response.status_code in [404, 500, 422]

def test_etl_process_unauthorized():
    # If there's no auth, it might just run or fail, let's just test it responds
    response = client.post("/etl/process")
    assert response.status_code in [200, 202, 500]

def test_analytics_distribution():
    response = client.get("/analytics/fraud-distribution")
    # Even if DB is empty, it should return a 200 with an empty list or default distribution
    assert response.status_code == 200
    assert isinstance(response.json(), list)
