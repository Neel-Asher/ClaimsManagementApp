from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Req(BaseModel):
    claim_amount: float
    days_since_policy_start: int
    claim_type: str
    previous_claims_count: int
    customer_age: int

@app.post("/predict/fraud/{c_id}")
def p(c_id: str, r: Req):
    return {
        "fraud_probability": 78,
        "risk_status": "High Risk Flag for Investigation",
        "recommendation": "Request additional documents and re-inspection"
    }