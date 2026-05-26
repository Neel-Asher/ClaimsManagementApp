"""
ml/train_model.py
=================
Training pipeline for the fraud detection ML model.

Trains two classifiers (Logistic Regression and Random Forest) on the
synthetic claims dataset, compares their performance, and saves the
best model as a pickle file.

Usage:
    python -m ml.train_model

Pipeline Steps:
    1. Load claims_history.csv
    2. Feature engineering (encode claim types, handle nulls)
    3. Train/test split (80/20, stratified)
    4. Train Logistic Regression and Random Forest
    5. Evaluate both models (accuracy, precision, recall, F1)
    6. Save the best performing model as fraud_model.pkl

The trained model expects these features (in order):
    claim_amount, days_since_policy_start, claim_type (encoded),
    previous_claims_count, customer_age, policy_premium_ratio,
    surveyor_mismatch_flag
"""

import os
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# ── Paths ──────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "sample", "claims_history.csv")
MODEL_PATH = os.path.join(BASE_DIR, "ml", "fraud_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "ml", "scaler.pkl")

# ── Feature configuration ─────────────────────────────────────
FEATURE_COLUMNS = [
    "claim_amount",
    "days_since_policy_start",
    "claim_type_encoded",
    "previous_claims_count",
    "customer_age",
    "policy_premium_ratio",
    "surveyor_mismatch_flag",
]
TARGET_COLUMN = "is_fraud"

# Claim type label encoding (must match predictor.py)
CLAIM_TYPE_ENCODING = {
    "motor_accident": 0,
    "health": 1,
    "property_damage": 2,
    "life": 3,
}


def load_and_prepare_data(data_path: str = DATA_PATH) -> tuple[pd.DataFrame, pd.Series]:
    """
    Load claims CSV and prepare features for training.

    Steps:
        1. Read CSV file
        2. Encode claim_type as integer
        3. Fill missing values with sensible defaults
        4. Select feature columns and target

    Args:
        data_path: Path to claims_history.csv

    Returns:
        Tuple of (features DataFrame, target Series)
    """
    print(f"Loading data from: {data_path}")

    if not os.path.exists(data_path):
        print(f"ERROR: Data file not found at '{data_path}'")
        print("Run 'python -m scripts.generate_data' first to create sample data.")
        sys.exit(1)

    df = pd.read_csv(data_path)
    print(f"  Loaded {len(df)} rows, {len(df.columns)} columns")

    # ── Encode claim type ──────────────────────────────────────
    df["claim_type_encoded"] = df["claim_type"].map(CLAIM_TYPE_ENCODING).fillna(0).astype(int)

    # ── Fill missing values ────────────────────────────────────
    df["policy_premium_ratio"] = df["policy_premium_ratio"].fillna(0.0)
    df["surveyor_mismatch_flag"] = df["surveyor_mismatch_flag"].fillna(0).astype(int)

    # ── Select features and target ─────────────────────────────
    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].copy()

    print(f"  Features: {list(X.columns)}")
    print(f"  Target distribution: {dict(y.value_counts())}")
    print(f"  Fraud rate: {y.mean() * 100:.1f}%")

    return X, y


def train_and_evaluate():
    """
    Train both Logistic Regression and Random Forest, compare, save best.

    Prints detailed metrics for both models and saves the winner.
    """
    print("\n" + "=" * 60)
    print("  InsuranceIQ -- Fraud Model Training Pipeline")
    print("=" * 60)

    # ── Step 1: Load data ──────────────────────────────────────
    X, y = load_and_prepare_data()

    # ── Step 2: Train/test split ───────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y,  # Preserve fraud/non-fraud ratio
    )
    print(f"\n  Train set: {len(X_train)} rows")
    print(f"  Test set:  {len(X_test)} rows")

    # ── Step 3: Scale features ─────────────────────────────────
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── Step 4: Train models ───────────────────────────────────
    models = {
        "Logistic Regression": LogisticRegression(
            random_state=42,
            max_iter=1000,
            class_weight="balanced",  # Handle class imbalance
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            class_weight="balanced",
            max_depth=10,
        ),
    }

    results = {}
    for name, model in models.items():
        print(f"\n{'-' * 60}")
        print(f"  Training: {name}")
        print(f"{'-' * 60}")

        # Use scaled data for Logistic Regression, raw for Random Forest
        if name == "Logistic Regression":
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)
            y_proba = model.predict_proba(X_test_scaled)[:, 1]
        else:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            y_proba = model.predict_proba(X_test)[:, 1]

        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, zero_division=0)
        cm = confusion_matrix(y_test, y_pred)

        print(f"\n  Accuracy: {accuracy * 100:.2f}%")
        print(f"\n  Classification Report:\n{report}")
        print(f"  Confusion Matrix:\n{cm}")

        results[name] = {
            "model": model,
            "accuracy": accuracy,
            "predictions": y_pred,
            "probabilities": y_proba,
        }

    # ── Step 5: Select best model ──────────────────────────────
    best_name = max(results, key=lambda k: results[k]["accuracy"])
    best_model = results[best_name]["model"]
    best_accuracy = results[best_name]["accuracy"]

    print(f"\n{'=' * 60}")
    print(f"  BEST MODEL: {best_name} ({best_accuracy * 100:.2f}% accuracy)")
    print(f"{'=' * 60}")

    # ── Step 6: Save model and scaler ──────────────────────────
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    # For Logistic Regression, we need the scaler at inference time
    # For Random Forest, we save a dummy scaler (identity) or skip it
    # To keep the pipeline simple, we always save the scaler
    # but the predictor works on raw features (Random Forest doesn't need scaling)
    if best_name == "Logistic Regression":
        # Retrain on raw data so predictor doesn't need scaler
        # This simplifies the inference pipeline
        best_model_raw = LogisticRegression(
            random_state=42, max_iter=1000, class_weight="balanced"
        )
        best_model_raw.fit(X_train, y_train)
        raw_accuracy = accuracy_score(y_test, best_model_raw.predict(X_test))
        print(f"  Re-trained on raw features: {raw_accuracy * 100:.2f}% accuracy")
        joblib.dump(best_model_raw, MODEL_PATH)
    else:
        joblib.dump(best_model, MODEL_PATH)

    print(f"  Model saved to: {os.path.abspath(MODEL_PATH)}")
    print(f"  OK: Training pipeline complete!")
    print(f"  OK: Model ready for inference via POST /predict/fraud/{{claim_id}}")

    return best_model, best_accuracy


if __name__ == "__main__":
    train_and_evaluate()
