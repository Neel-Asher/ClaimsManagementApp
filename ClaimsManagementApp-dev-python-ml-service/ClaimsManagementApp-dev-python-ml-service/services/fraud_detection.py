"""
services/fraud_detection.py
============================
Fraud detection engine with two operational modes:

1. RULE_BASED — Deterministic rules from the project specification.
   Fast, transparent, no model training required.

2. ML — Machine learning model (Logistic Regression / Random Forest).
   Trained on historical claims data for probabilistic scoring.

The service automatically switches between modes based on the
FRAUD_DETECTION_MODE configuration setting.

Architecture:
    FraudDetectionService (facade)
        ├── RuleBasedFraudDetector
        └── MLFraudDetector (uses ml/predictor.py)

Usage:
    from services.fraud_detection import FraudDetectionService
    service = FraudDetectionService()
    result = service.predict(claim_id="CLM-001", request=fraud_request)
"""

import logging
from dataclasses import dataclass

from config import FraudDetectionMode, get_settings
from models.schemas import FraudPredictionRequest, FraudPredictionResponse

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
#  RULE-BASED FRAUD DETECTOR
# ═══════════════════════════════════════════════════════════════


@dataclass
class FraudRule:
    """A single fraud detection rule with thresholds and scoring."""
    name: str
    weight: float  # Contribution to total fraud score (0-100)
    evaluate: callable  # Function that takes request and returns score


class RuleBasedFraudDetector:
    """
    Deterministic fraud detection using the project spec's rule matrix.

    Rule Matrix (from PDF):
        ┌─────────────────┬──────────────────────┬────────────────────┬──────────────────────────────┐
        │ Claim Amount     │ Days Since Policy    │ Prior Claims Count │ Result                       │
        ├─────────────────┼──────────────────────┼────────────────────┼──────────────────────────────┤
        │ < ₹50,000       │ > 180 days           │ 0–1                │ Low Risk — Proceed           │
        │ ₹50K – ₹2L      │ 30–180 days          │ 2–3                │ Moderate Risk — Req Docs     │
        │ > ₹2,00,000     │ < 30 days            │ > 3                │ High Risk — Flag             │
        └─────────────────┴──────────────────────┴────────────────────┴──────────────────────────────┘

    The detector uses a weighted scoring system where each factor
    contributes independently to the total fraud probability.
    """

    def predict(self, request: FraudPredictionRequest) -> tuple[float, str, str]:
        """
        Evaluate fraud risk using rule-based scoring.

        Args:
            request: Fraud prediction input features.

        Returns:
            Tuple of (fraud_probability, risk_status, recommendation).
        """
        score = 0.0
        factors = []

        # ── Factor 1: Claim Amount (weight: 30%) ──────────────
        if request.claim_amount > 200000:
            score += 30.0
            factors.append("Very high claim amount (> ₹2L)")
        elif request.claim_amount > 100000:
            score += 20.0
            factors.append("High claim amount (₹1L - ₹2L)")
        elif request.claim_amount > 50000:
            score += 10.0
            factors.append("Moderate claim amount (₹50K - ₹1L)")
        # Below 50K contributes 0

        # ── Factor 2: Policy Age — Days Since Start (weight: 25%) ──
        if request.days_since_policy_start < 30:
            score += 25.0
            factors.append("Very new policy (< 30 days)")
        elif request.days_since_policy_start < 90:
            score += 15.0
            factors.append("New policy (30-90 days)")
        elif request.days_since_policy_start < 180:
            score += 8.0
            factors.append("Recent policy (90-180 days)")
        # Older policies contribute 0

        # ── Factor 3: Previous Claims Count (weight: 20%) ─────
        if request.previous_claims_count > 3:
            score += 20.0
            factors.append(f"High prior claims ({request.previous_claims_count})")
        elif request.previous_claims_count >= 2:
            score += 12.0
            factors.append(f"Moderate prior claims ({request.previous_claims_count})")
        elif request.previous_claims_count == 1:
            score += 4.0

        # ── Factor 4: Customer Age (weight: 10%) ──────────────
        if request.customer_age < 25:
            score += 10.0
            factors.append("Young policyholder (< 25)")
        elif request.customer_age < 30:
            score += 5.0

        # ── Factor 5: Policy Premium Ratio (weight: 10%) ──────
        ratio = request.policy_premium_ratio or 0
        if ratio > 5.0:
            score += 10.0
            factors.append(f"Very high claim-to-premium ratio ({ratio:.1f}x)")
        elif ratio > 3.0:
            score += 6.0
            factors.append(f"High claim-to-premium ratio ({ratio:.1f}x)")

        # ── Factor 6: Surveyor Mismatch (weight: 5%) ──────────
        if request.surveyor_mismatch_flag == 1:
            score += 5.0
            factors.append("Surveyor report mismatch detected")

        # ── Clamp to 0-100 range ──────────────────────────────
        fraud_probability = min(max(score, 0.0), 100.0)

        # ── Classify risk level ───────────────────────────────
        risk_status, recommendation = self._classify_risk(fraud_probability, factors)

        logger.info(
            "Rule-based prediction: %.1f%% | %s | Factors: %s",
            fraud_probability, risk_status, ", ".join(factors) or "None",
        )

        return fraud_probability, risk_status, recommendation

    @staticmethod
    def _classify_risk(probability: float, factors: list[str]) -> tuple[str, str]:
        """Map fraud probability to risk status and recommendation."""
        if probability >= 60:
            return (
                "High Risk — Flag for Investigation",
                "Request additional documents and surveyor re-inspection. "
                "Escalate to senior claims manager for manual review.",
            )
        elif probability >= 35:
            return (
                "Moderate Risk — Request Documents",
                "Request supporting documents from the policyholder. "
                "Verify claim details with the assigned surveyor.",
            )
        else:
            return (
                "Low Risk — Proceed to Settlement",
                "Claim appears legitimate based on available data. "
                "Proceed with standard settlement workflow.",
            )


# ═══════════════════════════════════════════════════════════════
#  ML-BASED FRAUD DETECTOR
# ═══════════════════════════════════════════════════════════════


class MLFraudDetector:
    """
    ML-based fraud detection using a trained scikit-learn model.

    Loads the model from the configured pickle file and runs inference
    on incoming claim features. Falls back to rule-based if model
    is unavailable.

    The model expects these features (in order):
        claim_amount, days_since_policy_start, claim_type (encoded),
        previous_claims_count, customer_age, policy_premium_ratio,
        surveyor_mismatch_flag
    """

    # Claim type encoding (must match training pipeline)
    CLAIM_TYPE_ENCODING = {
        "motor_accident": 0,
        "health": 1,
        "property_damage": 2,
        "life": 3,
    }

    def __init__(self):
        """Initialize ML detector and load model."""
        self._model = None
        self._load_model()

    def _load_model(self):
        """Load the trained model from disk."""
        from ml.predictor import load_fraud_model
        self._model = load_fraud_model()
        if self._model is not None:
            logger.info("ML fraud model loaded successfully.")
        else:
            logger.warning("ML fraud model not found. Will fall back to rule-based.")

    @property
    def is_available(self) -> bool:
        """Check if the ML model is loaded and ready."""
        return self._model is not None

    def predict(self, request: FraudPredictionRequest) -> tuple[float, str, str]:
        """
        Run ML model inference on claim features.

        Args:
            request: Fraud prediction input features.

        Returns:
            Tuple of (fraud_probability, risk_status, recommendation).

        Raises:
            RuntimeError: If the model is not loaded.
        """
        if not self.is_available:
            raise RuntimeError("ML model is not loaded. Train the model first.")

        from ml.predictor import predict_fraud
        fraud_probability = predict_fraud(self._model, request)

        # Classify using same thresholds as rule-based
        if fraud_probability >= 60:
            risk_status = "High Risk — Flag for Investigation"
            recommendation = (
                "ML model detected high fraud probability. "
                "Request additional documents and surveyor re-inspection."
            )
        elif fraud_probability >= 35:
            risk_status = "Moderate Risk — Request Documents"
            recommendation = (
                "ML model detected moderate fraud signals. "
                "Verify claim details and request supporting documents."
            )
        else:
            risk_status = "Low Risk — Proceed to Settlement"
            recommendation = (
                "ML model indicates low fraud probability. "
                "Proceed with standard settlement workflow."
            )

        logger.info("ML prediction: %.1f%% | %s", fraud_probability, risk_status)
        return fraud_probability, risk_status, recommendation


# ═══════════════════════════════════════════════════════════════
#  FRAUD DETECTION SERVICE (Facade)
# ═══════════════════════════════════════════════════════════════


class FraudDetectionService:
    """
    Main fraud detection service — the single entry point for all
    fraud scoring in the application.

    Automatically selects the detection mode based on configuration.
    Falls back to rule-based if ML model is unavailable.

    Usage:
        service = FraudDetectionService()
        response = service.predict("CLM-001", request)
    """

    def __init__(self):
        """Initialize both detectors based on configuration."""
        self._settings = get_settings()
        self._rule_detector = RuleBasedFraudDetector()
        self._ml_detector = None

        if self._settings.FRAUD_DETECTION_MODE == FraudDetectionMode.ML:
            try:
                self._ml_detector = MLFraudDetector()
            except Exception as e:
                logger.warning("Failed to initialize ML detector: %s. Using rule-based.", e)

    @property
    def active_mode(self) -> str:
        """Return the currently active detection mode."""
        if (
            self._settings.FRAUD_DETECTION_MODE == FraudDetectionMode.ML
            and self._ml_detector is not None
            and self._ml_detector.is_available
        ):
            return FraudDetectionMode.ML.value
        return FraudDetectionMode.RULE_BASED.value

    def predict(
        self,
        claim_id: str,
        request: FraudPredictionRequest,
    ) -> FraudPredictionResponse:
        """
        Run fraud detection on a claim.

        Selects the appropriate detector based on configuration,
        with automatic fallback to rule-based if ML is unavailable.

        Args:
            claim_id: The claim identifier.
            request: Input features for prediction.

        Returns:
            FraudPredictionResponse with score, status, and recommendation.
        """
        import uuid
        from datetime import datetime

        # ── Auto-compute policy_premium_ratio if not provided ──
        if request.policy_premium_ratio is None:
            # Estimate a typical premium based on claim amount
            estimated_premium = request.claim_amount * 0.15
            request.policy_premium_ratio = round(
                request.claim_amount / estimated_premium, 2
            ) if estimated_premium > 0 else 0.0

        # ── Select detector ────────────────────────────────────
        mode = self.active_mode
        if mode == FraudDetectionMode.ML.value:
            fraud_probability, risk_status, recommendation = (
                self._ml_detector.predict(request)
            )
        else:
            fraud_probability, risk_status, recommendation = (
                self._rule_detector.predict(request)
            )

        # ── Build response ─────────────────────────────────────
        return FraudPredictionResponse(
            claim_id=claim_id,
            fraud_probability=round(fraud_probability, 2),
            risk_status=risk_status,
            recommendation=recommendation,
            detection_mode=mode,
            prediction_id=str(uuid.uuid4()),
            generated_at=datetime.utcnow(),
        )
