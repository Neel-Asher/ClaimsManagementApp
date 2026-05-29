"""
models/schemas.py
=================
Pydantic schemas for all API request/response models.

These schemas define the contract between the Python service and
external consumers (Spring Boot backend, React frontend).
All field names use snake_case for Python, but FastAPI auto-converts
to camelCase in JSON responses if configured.

Organized by domain:
    - Fraud Detection
    - ETL Processing
    - Analytics
    - Common / Health
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════
#  FRAUD DETECTION SCHEMAS
# ═══════════════════════════════════════════════════════════════


class FraudPredictionRequest(BaseModel):
    """
    Input features for fraud prediction.

    Sent by Spring Boot when a claim is submitted.
    Maps to the feature set defined in the project spec.
    """
    claim_amount: float = Field(
        ...,
        gt=0,
        description="Claimed amount in INR",
        examples=[95000.0],
    )
    days_since_policy_start: int = Field(
        ...,
        ge=0,
        description="Days between policy start date and claim date",
        examples=[12],
    )
    claim_type: str = Field(
        ...,
        description="Type of claim: motor_accident, health, property_damage, life",
        examples=["motor_accident"],
    )
    previous_claims_count: int = Field(
        ...,
        ge=0,
        description="Total prior claims by the same customer",
        examples=[3],
    )
    customer_age: int = Field(
        ...,
        gt=0,
        le=120,
        description="Age of the policyholder at time of claim",
        examples=[29],
    )
    policy_premium_ratio: Optional[float] = Field(
        default=None,
        ge=0,
        description="Claim amount / annual premium paid. Auto-computed if not provided.",
        examples=[4.5],
    )
    surveyor_mismatch_flag: Optional[int] = Field(
        default=0,
        ge=0,
        le=1,
        description="1 if survey report contradicts the claim (rule-based flag)",
        examples=[0],
    )


class FraudPredictionResponse(BaseModel):
    """
    Output of the fraud detection engine.

    Returned to Spring Boot for display on the Claims Assessment screen.
    """
    claim_id: str = Field(
        ...,
        description="The claim ID that was evaluated",
    )
    fraud_probability: float = Field(
        ...,
        ge=0,
        le=100,
        description="Fraud likelihood as a percentage (0-100)",
    )
    risk_status: str = Field(
        ...,
        description="Human-readable risk classification",
        examples=["High Risk — Flag for Investigation"],
    )
    recommendation: str = Field(
        ...,
        description="Actionable recommendation for the claims manager",
    )
    detection_mode: str = Field(
        ...,
        description="Detection method used: RULE_BASED or ML",
    )
    prediction_id: Optional[str] = Field(
        default=None,
        description="Unique ID for this prediction record (for audit trail)",
    )
    generated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the prediction was generated",
    )


# ═══════════════════════════════════════════════════════════════
#  ETL PROCESSING SCHEMAS
# ═══════════════════════════════════════════════════════════════


class ETLProcessRequest(BaseModel):
    """
    Request to trigger the ETL pipeline.

    Can process either uploaded CSV files or the built-in sample data.
    """
    source_type: str = Field(
        default="sample",
        description="Data source: 'sample' (built-in CSVs) or 'upload' (user-uploaded file)",
        examples=["sample"],
    )
    file_path: Optional[str] = Field(
        default=None,
        description="Path to uploaded CSV file (required when source_type='upload')",
    )


class ETLProcessResponse(BaseModel):
    """
    Summary of ETL pipeline execution results.
    """
    status: str = Field(
        ...,
        description="Pipeline status: 'success', 'partial', or 'failed'",
    )
    rows_processed: int = Field(
        ...,
        ge=0,
        description="Number of rows successfully processed",
    )
    rows_failed: int = Field(
        default=0,
        ge=0,
        description="Number of rows that failed validation",
    )
    errors: list[str] = Field(
        default_factory=list,
        description="List of error messages for failed rows",
    )
    processing_time_ms: float = Field(
        ...,
        ge=0,
        description="Total processing time in milliseconds",
    )
    summary: dict = Field(
        default_factory=dict,
        description="Additional processing summary statistics",
    )


# ═══════════════════════════════════════════════════════════════
#  ANALYTICS SCHEMAS
# ═══════════════════════════════════════════════════════════════


class ClaimsTrendItem(BaseModel):
    """Single data point for claims trend chart (line/bar chart)."""
    month: str = Field(..., description="Month label (e.g., '2025-01')")
    claims_received: int = Field(default=0)
    claims_settled: int = Field(default=0)
    claims_rejected: int = Field(default=0)


class ClaimsTrendResponse(BaseModel):
    """Full claims trend dataset for charting."""
    data: list[ClaimsTrendItem]
    total_received: int = 0
    total_settled: int = 0
    total_rejected: int = 0


class FraudFlaggedClaim(BaseModel):
    """A single fraud-flagged claim for the fraud report table."""
    claim_id: str
    policy_id: str
    customer_id: str
    claim_type: str
    claim_amount: float
    fraud_probability: float
    risk_status: str
    recommendation: str
    incident_date: Optional[str] = None


class FraudFlaggedResponse(BaseModel):
    """List of all fraud-flagged claims."""
    data: list[FraudFlaggedClaim]
    total_flagged: int = 0
    high_risk_count: int = 0
    moderate_risk_count: int = 0


class TopAgent(BaseModel):
    """Agent performance entry for leaderboard chart."""
    agent_id: str
    agent_name: str
    region: str
    total_premium_collected: float
    policies_sold: int
    claims_ratio: float = Field(
        default=0.0,
        description="Claims filed / policies sold ratio",
    )


class TopAgentsResponse(BaseModel):
    """Top-performing agents dataset."""
    data: list[TopAgent]


class LossRatioItem(BaseModel):
    """Loss ratio per product line for grouped bar chart."""
    product_type: str
    premium_collected: float
    claims_paid: float
    loss_ratio: float = Field(
        description="claims_paid / premium_collected as percentage",
    )


class LossRatioResponse(BaseModel):
    """Loss ratio breakdown by product."""
    data: list[LossRatioItem]
    overall_loss_ratio: float = 0.0


class RenewalRateItem(BaseModel):
    """Monthly policy renewal rate for area chart."""
    month: str
    total_policies: int
    renewed: int
    lapsed: int
    renewal_rate: float = Field(
        description="Percentage of policies renewed",
    )


class RenewalRateResponse(BaseModel):
    """Renewal rate trend dataset."""
    data: list[RenewalRateItem]
    avg_renewal_rate: float = 0.0


class DashboardSummary(BaseModel):
    """
    Aggregate KPIs for the main dashboard header cards.

    This is the first thing admins/managers see when they log in.
    """
    total_policies: int = 0
    active_policies: int = 0
    total_claims: int = 0
    pending_claims: int = 0
    settled_claims: int = 0
    rejected_claims: int = 0
    fraud_flagged_claims: int = 0
    total_premium_collected: float = 0.0
    total_claims_paid: float = 0.0
    settlement_rate: float = Field(
        default=0.0,
        description="Percentage of claims settled vs total",
    )
    avg_processing_days: float = Field(
        default=0.0,
        description="Average days to settle a claim",
    )
    active_agents: int = 0
    total_customers: int = 0


# ═══════════════════════════════════════════════════════════════
#  COMMON / HEALTH SCHEMAS
# ═══════════════════════════════════════════════════════════════


class HealthResponse(BaseModel):
    """Health check response for monitoring and load balancers."""
    status: str = "healthy"
    service: str = "InsuranceIQ Intelligence Service"
    version: str = "1.0.0"
    fraud_detection_mode: str = "RULE_BASED"
    database: str = "connected"
