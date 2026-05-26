"""
ml/predictor.py
===============
Model loading and inference utilities for fraud prediction.

Provides functions to:
    - Load a trained sklearn model from disk
    - Preprocess a single prediction request (same pipeline as training)
    - Return fraud probability as a percentage

Used by:
    - services/fraud_detection.py (MLFraudDetector)
    - routers/fraud_router.py (via the service)

The preprocessing must match the training pipeline in train_model.py
exactly to ensure consistent predictions.
"""

import logging
import os

import numpy as np

logger = logging.getLogger(__name__)

# ── Claim type encoding (must match training pipeline) ─────────
CLAIM_TYPE_ENCODING = {
    "motor_accident": 0,
    "health": 1,
    "property_damage": 2,
    "life": 3,
}


def load_fraud_model():
    """
    Load the trained fraud detection model from disk.

    Looks for the model file at the path specified in config.
    Returns None if the model file doesn't exist (e.g., before training).

    Returns:
        Trained sklearn model or None if not found.
    """
    from config import get_settings
    settings = get_settings()
    model_path = settings.ML_MODEL_PATH

    if not os.path.exists(model_path):
        logger.warning("Model file not found at '%s'.", model_path)
        return None

    try:
        import joblib
        model = joblib.load(model_path)
        logger.info("Fraud model loaded from '%s'.", model_path)
        return model
    except Exception as e:
        logger.error("Failed to load model from '%s': %s", model_path, e)
        return None


def preprocess_request(request) -> np.ndarray:
    """
    Convert a FraudPredictionRequest into a feature vector for the model.

    Feature order (must match train_model.py):
        [0] claim_amount
        [1] days_since_policy_start
        [2] claim_type (encoded as integer)
        [3] previous_claims_count
        [4] customer_age
        [5] policy_premium_ratio
        [6] surveyor_mismatch_flag

    Args:
        request: FraudPredictionRequest with claim features.

    Returns:
        numpy array of shape (1, 7) ready for model.predict_proba().
    """
    # Encode claim type — unknown types default to 0
    claim_type_encoded = CLAIM_TYPE_ENCODING.get(
        request.claim_type.lower().strip(), 0
    )

    # Build feature vector in the exact order used during training
    features = np.array([[
        request.claim_amount,
        request.days_since_policy_start,
        claim_type_encoded,
        request.previous_claims_count,
        request.customer_age,
        request.policy_premium_ratio or 0.0,
        request.surveyor_mismatch_flag or 0,
    ]])

    return features


def predict_fraud(model, request) -> float:
    """
    Run fraud prediction on a single claim.

    Args:
        model: Trained sklearn classifier with predict_proba().
        request: FraudPredictionRequest with claim features.

    Returns:
        Fraud probability as a percentage (0-100).
    """
    features = preprocess_request(request)

    try:
        # predict_proba returns [[prob_not_fraud, prob_fraud]]
        probabilities = model.predict_proba(features)
        fraud_prob = probabilities[0][1] * 100  # Convert to percentage
    except Exception as e:
        logger.error("Model prediction failed: %s. Using fallback.", e)
        # Fallback: use basic heuristic
        fraud_prob = min(
            (request.claim_amount / 500000) * 50
            + (1 - min(request.days_since_policy_start, 365) / 365) * 30
            + (request.previous_claims_count / 5) * 20,
            100.0,
        )

    return round(fraud_prob, 2)
