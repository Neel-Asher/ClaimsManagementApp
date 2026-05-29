"""
routers/fraud_router.py
========================
Fraud detection API endpoint.

Exposes:
    POST /predict/fraud/{claim_id}

Called by Spring Boot when a claim is submitted for fraud assessment.
Stores the prediction result in the database for audit trail.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config import get_settings
from models.database import FraudPredictionRecord, get_db
from models.schemas import FraudPredictionRequest, FraudPredictionResponse
from services.fraud_detection import FraudDetectionService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/predict",
    tags=["Fraud Detection"],
    responses={
        200: {"description": "Fraud prediction result"},
        422: {"description": "Invalid input features"},
    },
)

# ── Initialize fraud detection service (singleton) ─────────────
_fraud_service: FraudDetectionService | None = None


def get_fraud_service() -> FraudDetectionService:
    """Lazy-initialize the fraud detection service singleton."""
    global _fraud_service
    if _fraud_service is None:
        _fraud_service = FraudDetectionService()
    return _fraud_service


# ═══════════════════════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@router.post(
    "/fraud/{claim_id}",
    response_model=FraudPredictionResponse,
    summary="Predict fraud risk for a claim",
    description="""
    Evaluates a claim's fraud risk based on input features.

    **Detection Modes:**
    - `RULE_BASED` — Deterministic rules (default, no model needed)
    - `ML` — Machine learning model (requires trained model)

    **Called by:** Spring Boot backend after claim submission.

    **Risk Levels:**
    - `< 35%` → Low Risk — Proceed to Settlement
    - `35-60%` → Moderate Risk — Request Documents
    - `> 60%` → High Risk — Flag for Investigation
    """,
)
def predict_fraud(
    claim_id: str,
    request: FraudPredictionRequest,
    db: Session = Depends(get_db),
):
    """
    Run fraud detection on a specific claim.

    Args:
        claim_id: Unique claim identifier (from Spring Boot).
        request: Claim features for fraud evaluation.
        db: Database session (injected by FastAPI).

    Returns:
        FraudPredictionResponse with score, status, and recommendation.
    """
    logger.info("Fraud prediction requested for claim: %s", claim_id)

    try:
        # ── Run prediction ─────────────────────────────────────
        service = get_fraud_service()
        result = service.predict(claim_id, request)

        # ── Store in database for audit trail ──────────────────
        record = FraudPredictionRecord(
            prediction_id=result.prediction_id,
            claim_id=claim_id,
            claim_amount=request.claim_amount,
            days_since_policy_start=request.days_since_policy_start,
            claim_type=request.claim_type,
            previous_claims_count=request.previous_claims_count,
            customer_age=request.customer_age,
            policy_premium_ratio=request.policy_premium_ratio,
            surveyor_mismatch_flag=request.surveyor_mismatch_flag,
            fraud_probability=result.fraud_probability,
            risk_status=result.risk_status,
            recommendation=result.recommendation,
            detection_mode=result.detection_mode,
        )
        db.add(record)
        db.commit()

        logger.info(
            "Prediction stored: %s → %.1f%% (%s)",
            claim_id, result.fraud_probability, result.risk_status,
        )

        return result

    except Exception as e:
        logger.error("Fraud prediction failed for %s: %s", claim_id, str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Fraud prediction failed: {str(e)}",
        )


@router.get(
    "/fraud/history/{claim_id}",
    summary="Get prediction history for a claim",
    description="Retrieve all past fraud predictions for a given claim ID.",
)
def get_prediction_history(
    claim_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieve all past fraud predictions for a specific claim.

    Useful for audit trail and claims manager review.

    Args:
        claim_id: The claim identifier to look up.
        db: Database session (injected by FastAPI).

    Returns:
        List of past predictions for the claim.
    """
    records = (
        db.query(FraudPredictionRecord)
        .filter(FraudPredictionRecord.claim_id == claim_id)
        .order_by(FraudPredictionRecord.generated_at.desc())
        .all()
    )

    return [
        {
            "prediction_id": r.prediction_id,
            "claim_id": r.claim_id,
            "fraud_probability": r.fraud_probability,
            "risk_status": r.risk_status,
            "recommendation": r.recommendation,
            "detection_mode": r.detection_mode,
            "generated_at": r.generated_at.isoformat() if r.generated_at else None,
        }
        for r in records
    ]


@router.get(
    "/fraud/mode",
    summary="Get current fraud detection mode",
    description="Returns the currently active fraud detection mode (RULE_BASED or ML).",
)
def get_detection_mode():
    """Return the current fraud detection mode and model status."""
    service = get_fraud_service()
    settings = get_settings()
    return {
        "configured_mode": settings.FRAUD_DETECTION_MODE.value,
        "active_mode": service.active_mode,
        "description": (
            "Rule-based deterministic scoring"
            if service.active_mode == "RULE_BASED"
            else "Machine learning model prediction"
        ),
    }
