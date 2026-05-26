"""
Test all endpoints of the running server.
Run with: python scripts/test_live_server.py
"""

import httpx
import sys

base = "http://localhost:8001"

def main():
    print("=" * 60)
    print("  TESTING ALL ENDPOINTS (LIVE SERVER)")
    print("=" * 60)

    all_passed = True

    # 1. Health Check
    r = httpx.get(f"{base}/")
    print(f"\n[1] GET /  -> {r.status_code}")
    print(f"    {r.json()}")
    assert r.status_code == 200, "Health check failed"

    # 2. Fraud Detection - Low Risk
    payload = {
        "claim_amount": 25000,
        "days_since_policy_start": 365,
        "claim_type": "health",
        "previous_claims_count": 0,
        "customer_age": 45,
    }
    r = httpx.post(f"{base}/predict/fraud/CLM-001", json=payload)
    d = r.json()
    print(f"\n[2] POST /predict/fraud/CLM-001 (Low Risk) -> {r.status_code}")
    print(f"    Fraud Prob: {d.get('fraud_probability')}%")
    print(f"    Status: {d.get('risk_status')}")
    print(f"    Mode: {d.get('detection_mode')}")
    assert r.status_code == 200
    assert d["fraud_probability"] < 35, "Low risk should be < 35%"

    # 3. Fraud Detection - High Risk
    payload = {
        "claim_amount": 350000,
        "days_since_policy_start": 10,
        "claim_type": "motor_accident",
        "previous_claims_count": 5,
        "customer_age": 23,
        "surveyor_mismatch_flag": 1,
    }
    r = httpx.post(f"{base}/predict/fraud/CLM-002", json=payload)
    d = r.json()
    print(f"\n[3] POST /predict/fraud/CLM-002 (High Risk) -> {r.status_code}")
    print(f"    Fraud Prob: {d.get('fraud_probability')}%")
    print(f"    Status: {d.get('risk_status')}")
    print(f"    Recommendation: {d.get('recommendation')}")
    assert r.status_code == 200
    assert d["fraud_probability"] >= 60, "High risk should be >= 60%"

    # 4. Fraud Detection - Moderate Risk
    payload = {
        "claim_amount": 120000,
        "days_since_policy_start": 90,
        "claim_type": "motor_accident",
        "previous_claims_count": 2,
        "customer_age": 28,
    }
    r = httpx.post(f"{base}/predict/fraud/CLM-003", json=payload)
    d = r.json()
    print(f"\n[4] POST /predict/fraud/CLM-003 (Moderate Risk) -> {r.status_code}")
    print(f"    Fraud Prob: {d.get('fraud_probability')}%")
    print(f"    Status: {d.get('risk_status')}")
    assert r.status_code == 200

    # 5. Prediction History
    r = httpx.get(f"{base}/predict/fraud/history/CLM-001")
    print(f"\n[5] GET /predict/fraud/history/CLM-001 -> {r.status_code}")
    print(f"    Records found: {len(r.json())}")
    assert r.status_code == 200

    # 6. Detection Mode
    r = httpx.get(f"{base}/predict/fraud/mode")
    print(f"\n[6] GET /predict/fraud/mode -> {r.status_code}")
    print(f"    {r.json()}")
    assert r.status_code == 200

    # 7. ETL Process (load sample data)
    r = httpx.post(f"{base}/etl/process", json={"source_type": "sample"})
    d = r.json()
    print(f"\n[7] POST /etl/process (sample) -> {r.status_code}")
    print(f"    Status: {d.get('status')}")
    print(f"    Rows processed: {d.get('rows_processed')}")
    print(f"    Rows failed: {d.get('rows_failed')}")
    print(f"    Time: {d.get('processing_time_ms')}ms")
    assert r.status_code == 200
    assert d["status"] in ["success", "partial"]

    # 8. ETL Status
    r = httpx.get(f"{base}/etl/status")
    d = r.json()
    print(f"\n[8] GET /etl/status -> {r.status_code}")
    print(f"    Status: {d.get('status')}")
    print(f"    Tables: {d.get('tables')}")
    assert r.status_code == 200

    # 9. Dashboard Summary
    r = httpx.get(f"{base}/analytics/dashboard-summary")
    d = r.json()
    print(f"\n[9] GET /analytics/dashboard-summary -> {r.status_code}")
    print(f"    Total Policies: {d.get('total_policies')}")
    print(f"    Total Claims: {d.get('total_claims')}")
    print(f"    Fraud Flagged: {d.get('fraud_flagged_claims')}")
    print(f"    Premium Collected: {d.get('total_premium_collected')}")
    print(f"    Settlement Rate: {d.get('settlement_rate')}%")
    assert r.status_code == 200
    assert d["total_claims"] > 0, "Should have claims after ETL"

    # 10. Claims Trend
    r = httpx.get(f"{base}/analytics/claims-trend")
    d = r.json()
    print(f"\n[10] GET /analytics/claims-trend -> {r.status_code}")
    print(f"    Months: {len(d.get('data', []))}")
    print(f"    Total Received: {d.get('total_received')}")
    print(f"    Total Settled: {d.get('total_settled')}")
    assert r.status_code == 200

    # 11. Fraud Flagged Claims
    r = httpx.get(f"{base}/analytics/fraud-flagged-claims")
    d = r.json()
    print(f"\n[11] GET /analytics/fraud-flagged-claims -> {r.status_code}")
    print(f"    Total Flagged: {d.get('total_flagged')}")
    print(f"    High Risk: {d.get('high_risk_count')}")
    print(f"    Moderate Risk: {d.get('moderate_risk_count')}")
    if d.get("data"):
        top = d["data"][0]
        print(f"    Worst claim: {top.get('claim_id')} -> {top.get('fraud_probability')}%")
    assert r.status_code == 200

    # 12. Top Agents
    r = httpx.get(f"{base}/analytics/top-agents?limit=5")
    d = r.json()
    print(f"\n[12] GET /analytics/top-agents?limit=5 -> {r.status_code}")
    print(f"    Agents returned: {len(d.get('data', []))}")
    if d.get("data"):
        top = d["data"][0]
        print(f"    #1: {top.get('agent_name')} ({top.get('region')}) -> {top.get('total_premium_collected')}")
    assert r.status_code == 200

    # 13. Loss Ratio
    r = httpx.get(f"{base}/analytics/loss-ratio")
    d = r.json()
    print(f"\n[13] GET /analytics/loss-ratio -> {r.status_code}")
    print(f"    Products: {len(d.get('data', []))}")
    print(f"    Overall Loss Ratio: {d.get('overall_loss_ratio')}%")
    for item in d.get("data", []):
        print(f"      {item['product_type']}: {item['loss_ratio']}%")
    assert r.status_code == 200

    # 14. Renewal Rate
    r = httpx.get(f"{base}/analytics/renewal-rate")
    d = r.json()
    print(f"\n[14] GET /analytics/renewal-rate -> {r.status_code}")
    print(f"    Months: {len(d.get('data', []))}")
    print(f"    Avg Renewal Rate: {d.get('avg_renewal_rate')}%")
    assert r.status_code == 200

    print("\n" + "=" * 60)
    print("  ALL 14 ENDPOINT TESTS PASSED!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except httpx.ConnectError:
        print("ERROR: Server not running. Start with: python -m uvicorn main:app --port 8000")
        sys.exit(1)
    except AssertionError as e:
        print(f"\nTEST FAILED: {e}")
        sys.exit(1)
