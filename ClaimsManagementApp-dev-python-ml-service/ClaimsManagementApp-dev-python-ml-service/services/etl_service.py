"""
services/etl_service.py
=======================
ETL (Extract, Transform, Load) pipeline for insurance data processing.

This service handles the complete data pipeline:
    Extract  → Read CSV files (uploaded or sample data)
    Transform → Clean, normalize, derive features, validate
    Load     → Write processed records to the database

Triggered by:
    - POST /etl/process (via Spring Boot or admin panel)
    - scripts/seed_db.py (initial data load)

Supported CSV sources:
    - claims_history.csv   → ProcessedClaim table
    - policy_data.csv      → ProcessedPolicy table
    - agent_performance.csv → ProcessedAgent table
    - customer_profiles.csv → (used for enrichment, not stored separately)
"""

import logging
import os
import time
from typing import Optional

import pandas as pd
from sqlalchemy.orm import Session

from config import get_settings
from models.database import ProcessedAgent, ProcessedClaim, ProcessedPolicy

logger = logging.getLogger(__name__)


class ETLPipeline:
    """
    Main ETL pipeline for processing insurance CSV data.

    Designed to be idempotent — running it multiple times on the same
    data will update existing records (upsert behavior via delete + insert).

    Usage:
        pipeline = ETLPipeline(db_session)
        result = pipeline.run(source_type="sample")
    """

    def __init__(self, db: Session):
        """
        Initialize the ETL pipeline.

        Args:
            db: SQLAlchemy database session for loading processed data.
        """
        self._db = db
        self._settings = get_settings()
        self._errors: list[str] = []
        self._rows_processed = 0
        self._rows_failed = 0

    # ═══════════════════════════════════════════════════════════
    #  PUBLIC INTERFACE
    # ═══════════════════════════════════════════════════════════

    def run(
        self,
        source_type: str = "sample",
        file_path: Optional[str] = None,
    ) -> dict:
        """
        Execute the complete ETL pipeline.

        Args:
            source_type: "sample" for built-in data, "upload" for user file.
            file_path: Path to uploaded CSV (required when source_type="upload").

        Returns:
            Dictionary with processing results:
                status, rows_processed, rows_failed, errors,
                processing_time_ms, summary
        """
        start_time = time.time()
        self._errors = []
        self._rows_processed = 0
        self._rows_failed = 0
        summary = {}

        logger.info("Starting ETL pipeline (source: %s)", source_type)

        try:
            if source_type == "upload" and file_path:
                # ── Process single uploaded file ───────────────
                summary = self._process_uploaded_file(file_path)
            else:
                # ── Process all sample datasets ────────────────
                summary = self._process_all_sample_data()

            status = "success" if not self._errors else "partial"

        except Exception as e:
            logger.error("ETL pipeline failed: %s", str(e))
            self._errors.append(f"Pipeline error: {str(e)}")
            status = "failed"

        elapsed_ms = (time.time() - start_time) * 1000

        result = {
            "status": status,
            "rows_processed": self._rows_processed,
            "rows_failed": self._rows_failed,
            "errors": self._errors,
            "processing_time_ms": round(elapsed_ms, 2),
            "summary": summary,
        }

        logger.info(
            "ETL complete: %s | %d processed | %d failed | %.0fms",
            status, self._rows_processed, self._rows_failed, elapsed_ms,
        )

        return result

    # ═══════════════════════════════════════════════════════════
    #  PRIVATE — Process All Sample Data
    # ═══════════════════════════════════════════════════════════

    def _process_all_sample_data(self) -> dict:
        """Process all 3 sample CSV files (claims, policies, agents)."""
        data_dir = self._settings.DATA_DIR
        summary = {}

        # ── Process Claims ─────────────────────────────────────
        claims_path = os.path.join(data_dir, "claims_history.csv")
        if os.path.exists(claims_path):
            claims_result = self._process_claims(claims_path)
            summary["claims"] = claims_result
        else:
            self._errors.append(f"Claims file not found: {claims_path}")

        # ── Process Policies ───────────────────────────────────
        policies_path = os.path.join(data_dir, "policy_data.csv")
        if os.path.exists(policies_path):
            policies_result = self._process_policies(policies_path)
            summary["policies"] = policies_result
        else:
            self._errors.append(f"Policies file not found: {policies_path}")

        # ── Process Agents ─────────────────────────────────────
        agents_path = os.path.join(data_dir, "agent_performance.csv")
        if os.path.exists(agents_path):
            agents_result = self._process_agents(agents_path)
            summary["agents"] = agents_result
        else:
            self._errors.append(f"Agents file not found: {agents_path}")

        return summary

    def _process_uploaded_file(self, file_path: str) -> dict:
        """
        Detect file type from columns and process accordingly.

        Args:
            file_path: Path to the uploaded CSV file.

        Returns:
            Processing summary for the file.
        """
        if not os.path.exists(file_path):
            self._errors.append(f"File not found: {file_path}")
            return {"error": "File not found"}

        df = pd.read_csv(file_path)
        columns = set(df.columns)

        # Auto-detect the dataset type based on column names
        if "claim_id" in columns or "claim_amount" in columns:
            return {"claims": self._process_claims(file_path)}
        elif "policy_id" in columns and "premium_amount" in columns:
            return {"policies": self._process_policies(file_path)}
        elif "agent_id" in columns and "agent_name" in columns:
            return {"agents": self._process_agents(file_path)}
        else:
            self._errors.append(f"Unrecognized CSV format: {list(columns)[:5]}...")
            return {"error": "Unrecognized CSV format"}

    # ═══════════════════════════════════════════════════════════
    #  EXTRACT & TRANSFORM — Claims
    # ═══════════════════════════════════════════════════════════

    def _process_claims(self, file_path: str) -> dict:
        """
        Extract, transform, and load claims data.

        Transform steps:
            - Clean null values with sensible defaults
            - Normalize claim amounts (ensure positive)
            - Validate claim types against allowed list
            - Derive fraud score from rule-based engine
        """
        logger.info("Processing claims from: %s", file_path)
        df = pd.read_csv(file_path)
        initial_count = len(df)

        # ── Transform: Clean & Normalize ───────────────────────
        df["claim_amount"] = pd.to_numeric(df["claim_amount"], errors="coerce").fillna(0)
        df["claim_amount"] = df["claim_amount"].clip(lower=0)  # No negative amounts

        df["days_since_policy_start"] = (
            pd.to_numeric(df.get("days_since_policy_start"), errors="coerce").fillna(0).astype(int)
        )
        df["previous_claims_count"] = (
            pd.to_numeric(df.get("previous_claims_count"), errors="coerce").fillna(0).astype(int)
        )
        df["customer_age"] = (
            pd.to_numeric(df.get("customer_age"), errors="coerce").fillna(30).astype(int)
        )
        df["policy_premium_ratio"] = (
            pd.to_numeric(df.get("policy_premium_ratio"), errors="coerce").fillna(0.0)
        )
        df["surveyor_mismatch_flag"] = (
            pd.to_numeric(df.get("surveyor_mismatch_flag"), errors="coerce").fillna(0).astype(int)
        )

        # ── Transform: Validate claim types ────────────────────
        valid_types = {"motor_accident", "health", "property_damage", "life"}
        df["claim_type"] = df["claim_type"].apply(
            lambda x: x if x in valid_types else "motor_accident"
        )

        # ── Transform: Fill missing IDs ────────────────────────
        df["claim_id"] = df.get("claim_id", pd.Series([f"CLM-AUTO-{i}" for i in range(len(df))]))
        df["policy_id"] = df.get("policy_id", pd.Series(["UNKNOWN"] * len(df)))
        df["customer_id"] = df.get("customer_id", pd.Series(["UNKNOWN"] * len(df)))
        df["status"] = df.get("status", pd.Series(["pending"] * len(df)))

        # ── Transform: Compute simple fraud score ──────────────
        df["fraud_score"] = df.apply(self._compute_simple_fraud_score, axis=1)
        df["risk_status"] = df["fraud_score"].apply(self._classify_risk)

        # ── Load: Write to database ────────────────────────────
        loaded_count = self._load_claims_to_db(df)

        result = {
            "total_rows": initial_count,
            "processed": loaded_count,
            "failed": initial_count - loaded_count,
            "avg_claim_amount": round(df["claim_amount"].mean(), 2),
            "fraud_flagged": int((df["fraud_score"] >= 60).sum()),
        }

        self._rows_processed += loaded_count
        self._rows_failed += initial_count - loaded_count

        logger.info("Claims processed: %s", result)
        return result

    @staticmethod
    def _compute_simple_fraud_score(row) -> float:
        """Compute a simple rule-based fraud score for ETL bulk processing."""
        score = 0.0

        if row.get("claim_amount", 0) > 200000:
            score += 30
        elif row.get("claim_amount", 0) > 50000:
            score += 15

        if row.get("days_since_policy_start", 999) < 30:
            score += 25
        elif row.get("days_since_policy_start", 999) < 180:
            score += 10

        if row.get("previous_claims_count", 0) > 3:
            score += 20
        elif row.get("previous_claims_count", 0) >= 2:
            score += 10

        if row.get("customer_age", 40) < 25:
            score += 10

        if row.get("policy_premium_ratio", 0) > 5.0:
            score += 10

        if row.get("surveyor_mismatch_flag", 0) == 1:
            score += 5

        return min(score, 100.0)

    @staticmethod
    def _classify_risk(score: float) -> str:
        """Map fraud score to risk status label."""
        if score >= 60:
            return "High Risk — Flag for Investigation"
        elif score >= 35:
            return "Moderate Risk — Request Documents"
        else:
            return "Low Risk — Proceed to Settlement"

    def _load_claims_to_db(self, df: pd.DataFrame) -> int:
        """Load processed claims into the database (upsert via delete+insert)."""
        # Clear existing processed claims for idempotency
        self._db.query(ProcessedClaim).delete()
        self._db.flush()

        loaded = 0
        for _, row in df.iterrows():
            try:
                record = ProcessedClaim(
                    claim_id=str(row["claim_id"]),
                    policy_id=str(row.get("policy_id", "UNKNOWN")),
                    customer_id=str(row.get("customer_id", "UNKNOWN")),
                    agent_id=str(row.get("agent_id", "")),
                    claim_type=str(row["claim_type"]),
                    claim_amount=float(row["claim_amount"]),
                    incident_date=str(row.get("incident_date", "")),
                    status=str(row.get("status", "pending")),
                    days_since_policy_start=int(row.get("days_since_policy_start", 0)),
                    previous_claims_count=int(row.get("previous_claims_count", 0)),
                    customer_age=int(row.get("customer_age", 0)),
                    policy_premium_ratio=float(row.get("policy_premium_ratio", 0)),
                    surveyor_mismatch_flag=int(row.get("surveyor_mismatch_flag", 0)),
                    fraud_score=float(row.get("fraud_score", 0)),
                    risk_status=str(row.get("risk_status", "")),
                )
                self._db.add(record)
                loaded += 1
            except Exception as e:
                self._errors.append(f"Row {row.get('claim_id', '?')}: {str(e)}")

        self._db.commit()
        return loaded

    # ═══════════════════════════════════════════════════════════
    #  EXTRACT & TRANSFORM — Policies
    # ═══════════════════════════════════════════════════════════

    def _process_policies(self, file_path: str) -> dict:
        """Extract, transform, and load policy data."""
        logger.info("Processing policies from: %s", file_path)
        df = pd.read_csv(file_path)
        initial_count = len(df)

        # ── Transform ──────────────────────────────────────────
        df["premium_amount"] = pd.to_numeric(df["premium_amount"], errors="coerce").fillna(0)
        df["premium_amount"] = df["premium_amount"].clip(lower=0)
        df["status"] = df.get("status", pd.Series(["active"] * len(df)))
        df["product_type"] = df.get("product_type", pd.Series(["Motor"] * len(df)))

        # ── Load ───────────────────────────────────────────────
        self._db.query(ProcessedPolicy).delete()
        self._db.flush()

        loaded = 0
        for _, row in df.iterrows():
            try:
                record = ProcessedPolicy(
                    policy_id=str(row["policy_id"]),
                    customer_id=str(row.get("customer_id", "UNKNOWN")),
                    agent_id=str(row.get("agent_id", "")),
                    product_type=str(row.get("product_type", "Motor")),
                    start_date=str(row.get("start_date", "")),
                    end_date=str(row.get("end_date", "")),
                    premium_amount=float(row["premium_amount"]),
                    status=str(row.get("status", "active")),
                )
                self._db.add(record)
                loaded += 1
            except Exception as e:
                self._errors.append(f"Policy {row.get('policy_id', '?')}: {str(e)}")

        self._db.commit()
        self._rows_processed += loaded
        self._rows_failed += initial_count - loaded

        result = {
            "total_rows": initial_count,
            "processed": loaded,
            "failed": initial_count - loaded,
            "avg_premium": round(df["premium_amount"].mean(), 2),
            "status_breakdown": df["status"].value_counts().to_dict(),
        }
        logger.info("Policies processed: %s", result)
        return result

    # ═══════════════════════════════════════════════════════════
    #  EXTRACT & TRANSFORM — Agents
    # ═══════════════════════════════════════════════════════════

    def _process_agents(self, file_path: str) -> dict:
        """Extract, transform, and load agent performance data."""
        logger.info("Processing agents from: %s", file_path)
        df = pd.read_csv(file_path)
        initial_count = len(df)

        # ── Transform ──────────────────────────────────────────
        df["total_premium_collected"] = (
            pd.to_numeric(df.get("total_premium_collected"), errors="coerce").fillna(0)
        )
        df["policies_sold"] = (
            pd.to_numeric(df.get("policies_sold"), errors="coerce").fillna(0).astype(int)
        )
        df["claims_filed"] = (
            pd.to_numeric(df.get("claims_filed"), errors="coerce").fillna(0).astype(int)
        )

        # ── Load ───────────────────────────────────────────────
        self._db.query(ProcessedAgent).delete()
        self._db.flush()

        loaded = 0
        for _, row in df.iterrows():
            try:
                record = ProcessedAgent(
                    agent_id=str(row["agent_id"]),
                    agent_name=str(row.get("agent_name", "Unknown")),
                    region=str(row.get("region", "Unknown")),
                    total_premium_collected=float(row.get("total_premium_collected", 0)),
                    policies_sold=int(row.get("policies_sold", 0)),
                    claims_filed=int(row.get("claims_filed", 0)),
                    commission_pct=float(row.get("commission_pct", 0)),
                )
                self._db.add(record)
                loaded += 1
            except Exception as e:
                self._errors.append(f"Agent {row.get('agent_id', '?')}: {str(e)}")

        self._db.commit()
        self._rows_processed += loaded
        self._rows_failed += initial_count - loaded

        result = {
            "total_rows": initial_count,
            "processed": loaded,
            "failed": initial_count - loaded,
            "total_premium": round(df["total_premium_collected"].sum(), 2),
        }
        logger.info("Agents processed: %s", result)
        return result
