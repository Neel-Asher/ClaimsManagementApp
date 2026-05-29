"""
routers/analytics_router.py
=============================
Analytics API endpoints for dashboard charts and reports.

Exposes:
    GET /analytics/claims-trend       — Claims received/settled/rejected over time
    GET /analytics/fraud-flagged-claims — All fraud-flagged claims
    GET /analytics/top-agents          — Top agents by premium collected
    GET /analytics/loss-ratio          — Loss ratio by product type
    GET /analytics/renewal-rate        — Policy renewal rate trends
    GET /analytics/dashboard-summary   — Aggregate KPI cards

Called by Spring Boot (proxied to React) for Recharts rendering.
All endpoints return chart-ready JSON arrays.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from models.database import get_db
from models.schemas import (
    ClaimsTrendResponse,
    DashboardSummary,
    FraudFlaggedResponse,
    LossRatioResponse,
    RenewalRateResponse,
    TopAgentsResponse,
)
from services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
    responses={
        200: {"description": "Analytics data"},
        500: {"description": "Computation error"},
    },
)


# ═══════════════════════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@router.get(
    "/claims-trend",
    response_model=ClaimsTrendResponse,
    summary="Claims trend over time",
    description="""
    Monthly breakdown of claims received, settled, and rejected.
    
    **Chart type:** Line chart or grouped bar chart (Recharts)
    
    Returns an array of `{ month, claims_received, claims_settled, claims_rejected }`.
    """,
)
def get_claims_trend(db: Session = Depends(get_db)):
    """Get monthly claims trend for line/bar chart."""
    try:
        service = AnalyticsService(db)
        return service.get_claims_trend()
    except Exception as e:
        logger.error("Claims trend computation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/fraud-flagged-claims",
    response_model=FraudFlaggedResponse,
    summary="Fraud-flagged claims list",
    description="""
    All claims with fraud scores ≥ 35% (Moderate or High risk).
    
    **Chart type:** Data table with risk badges (Recharts Pie for distribution)
    
    Sorted by fraud probability (highest first).
    """,
)
def get_fraud_flagged_claims(db: Session = Depends(get_db)):
    """Get all fraud-flagged claims for the report table."""
    try:
        service = AnalyticsService(db)
        return service.get_fraud_flagged_claims()
    except Exception as e:
        logger.error("Fraud flagged claims retrieval failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/top-agents",
    response_model=TopAgentsResponse,
    summary="Top agents by premium collected",
    description="""
    Agent leaderboard ranked by total premium collected.
    
    **Chart type:** Horizontal bar chart (Recharts)
    
    Returns agent name, region, premium collected, policies sold.
    """,
)
def get_top_agents(
    limit: int = Query(
        default=10,
        ge=1,
        le=50,
        description="Maximum number of agents to return",
    ),
    db: Session = Depends(get_db),
):
    """Get top performing agents for leaderboard chart."""
    try:
        service = AnalyticsService(db)
        return service.get_top_agents(limit=limit)
    except Exception as e:
        logger.error("Top agents computation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/loss-ratio",
    response_model=LossRatioResponse,
    summary="Loss ratio by product type",
    description="""
    Loss ratio (claims paid / premium collected) per insurance product.
    
    **Chart type:** Grouped bar chart (Recharts)
    
    A loss ratio > 100% means the insurer is paying out more than collecting.
    """,
)
def get_loss_ratio(db: Session = Depends(get_db)):
    """Get loss ratio breakdown by product type."""
    try:
        service = AnalyticsService(db)
        return service.get_loss_ratio()
    except Exception as e:
        logger.error("Loss ratio computation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/renewal-rate",
    response_model=RenewalRateResponse,
    summary="Policy renewal rate trends",
    description="""
    Monthly policy renewal vs lapse rates.
    
    **Chart type:** Area chart (Recharts)
    
    Helps identify trends in customer retention.
    """,
)
def get_renewal_rate(db: Session = Depends(get_db)):
    """Get policy renewal rate trends for area chart."""
    try:
        service = AnalyticsService(db)
        return service.get_renewal_rate()
    except Exception as e:
        logger.error("Renewal rate computation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/dashboard-summary",
    response_model=DashboardSummary,
    summary="Dashboard KPI summary",
    description="""
    Aggregate KPIs for the main dashboard header cards.
    
    Returns total policies, active claims, fraud-flagged count,
    premium collected, settlement rate, and more.
    
    **Called by:** Spring Boot → `GET /api/analytics/dashboard-summary`
    """,
)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Get aggregate dashboard KPIs for header cards."""
    try:
        service = AnalyticsService(db)
        return service.get_dashboard_summary()
    except Exception as e:
        logger.error("Dashboard summary computation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
