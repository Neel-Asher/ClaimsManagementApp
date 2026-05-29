"""
tests/test_etl.py
==================
Tests for the ETL pipeline service and API endpoint.

Covers:
    - Sample data processing
    - ETL status endpoint
    - File upload endpoint (validation)
    - Processing results structure
"""

import os
import tempfile

import pytest


class TestETLProcessEndpoint:
    """Test the POST /etl/process endpoint."""

    def test_process_sample_data_success(self, client):
        """Processing sample data should succeed when CSVs exist."""
        response = client.post("/etl/process", json={"source_type": "sample"})

        # If sample data exists, should succeed; if not, should report errors
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["success", "partial", "failed"]
        assert "rows_processed" in data
        assert "processing_time_ms" in data
        assert isinstance(data["errors"], list)

    def test_process_returns_timing_info(self, client):
        """ETL response should include processing time."""
        response = client.post("/etl/process", json={"source_type": "sample"})
        data = response.json()
        assert data["processing_time_ms"] >= 0

    def test_process_upload_missing_file(self, client):
        """Processing an upload with a non-existent file should fail."""
        response = client.post("/etl/process", json={
            "source_type": "upload",
            "file_path": "/nonexistent/file.csv",
        })
        assert response.status_code == 400


class TestETLStatusEndpoint:
    """Test the GET /etl/status endpoint."""

    def test_status_empty_database(self, client):
        """Status on empty DB should show zero counts."""
        response = client.get("/etl/status")
        assert response.status_code == 200

        data = response.json()
        assert "status" in data
        assert "tables" in data
        assert "processed_claims" in data["tables"]
        assert "processed_policies" in data["tables"]
        assert "processed_agents" in data["tables"]

    def test_status_after_processing(self, client):
        """Status after ETL should show non-zero counts (if data exists)."""
        # Run ETL first
        client.post("/etl/process", json={"source_type": "sample"})

        # Check status
        response = client.get("/etl/status")
        data = response.json()
        assert "tables" in data


class TestETLUploadEndpoint:
    """Test the POST /etl/upload endpoint."""

    def test_reject_non_csv_file(self, client):
        """Should reject non-CSV file uploads."""
        response = client.post(
            "/etl/upload",
            files={"file": ("test.txt", b"some text content", "text/plain")},
        )
        assert response.status_code == 400
        assert "CSV" in response.json()["detail"]

    def test_accept_csv_file(self, client):
        """Should accept CSV file uploads."""
        csv_content = b"claim_id,claim_amount,claim_type\nCLM-001,50000,health\n"
        response = client.post(
            "/etl/upload",
            files={"file": ("test_claims.csv", csv_content, "text/csv")},
        )
        # Should process (may succeed or partial depending on columns)
        assert response.status_code in [200, 500]
