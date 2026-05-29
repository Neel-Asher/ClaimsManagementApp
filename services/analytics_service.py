"""
services/analytics_service.py
==============================
Analytics computation service for insurance dashboards.

Provides pre-computed, chart-ready JSON data for:
    - Claims trend (received vs settled vs rejected over time)
    - Fraud-flagged claims list with risk breakdown
    - Top agents by premium collected
    - Loss ratio by product type
    - Policy renewal rate trends
    - Dashboard summary KPIs

Data source: ProcessedClaim, ProcessedPolicy, ProcessedAgent tables
             (populated by the ETL pipeline).

These endpoints are called by:
    - Spring Boot → GET /api/analytics/dashboard-summary
    - React → via Spring Boot proxy for chart rendering
"""

import logging
from collections import defaultdict
from datetime import datetime

from sqlalchemy.orm import Session

from models.database import ProcessedAgent, ProcessedClaim, ProcessedPolicy
from models.schemas import (
    ClaimsTrendItem,
    ClaimsTrendResponse,
    DashboardSummary,
    FraudFlaggedClaim,
    FraudFlaggedResponse,
    LossRatioItem,
    LossRatioResponse,
    RenewalRateItem,
    RenewalRateResponse,
    TopAgent,
    TopAgentsResponse,
)

logger = logging.getLogger(__name__)


class AnalyticsService:
    """
    Analytics computation engine.

    Reads from the ETL-processed tables and returns structured data
    ready for Recharts rendering on the React frontend.

    Usage:
        service = AnalyticsService(db_session)
        trend = service.get_claims_trend()
    """

    def __init__(self, db: Session):
        """
        Initialize analytics service with a database session.

        Args:
            db: SQLAlchemy session for querying processed data.
        """
        self._db = db

    # ═══════════════════════════════════════════════════════════
    #  CLAIMS TREND — Line/Bar Chart
    # ═══════════════════════════════════════════════════════════

    def get_claims_trend(self) -> ClaimsTrendResponse:
        """
        Compute monthly claims trend: received vs settled vs rejected.

        Returns data suitable for a Recharts LineChart or BarChart.
        Groups claims by incident month and counts by status.
        """
        claims = self._db.query(ProcessedClaim).all()

        # Group by month from incident_date
        monthly: dict[str, dict[str, int]] = defaultdict(
            lambda: {"received": 0, "settled": 0, "rejected": 0}
        )

        for claim in claims:
            # Parse month from incident_date (format: YYYY-MM-DD)
            try:
                month = claim.incident_date[:7] if claim.incident_date else "Unknown"
            except (TypeError, IndexError):
                month = "Unknown"

            monthly[month]["received"] += 1
            if claim.status == "settled":
                monthly[month]["settled"] += 1
            elif claim.status == "rejected":
                monthly[month]["rejected"] += 1

        # Sort by month and build response
        sorted_months = sorted(monthly.keys())
        data = [
            ClaimsTrendItem(
                month=month,
                claims_received=monthly[month]["received"],
                claims_settled=monthly[month]["settled"],
                claims_rejected=monthly[month]["rejected"],
            )
            for month in sorted_months
        ]

        total_received = sum(d.claims_received for d in data)
        total_settled = sum(d.claims_settled for d in data)
        total_rejected = sum(d.claims_rejected for d in data)

        logger.info(
            "Claims trend: %d months, %d total received",
            len(data), total_received,
        )

        return ClaimsTrendResponse(
            data=data,
            total_received=total_received,
            total_settled=total_settled,
            total_rejected=total_rejected,
        )

    # ═══════════════════════════════════════════════════════════
    #  FRAUD-FLAGGED CLAIMS — Table / Report
    # ═══════════════════════════════════════════════════════════

    def get_fraud_flagged_claims(self) -> FraudFlaggedResponse:
        """
        Get all claims with fraud scores, sorted by risk (highest first).

        Returns data for the Fraud Detection Report page.
        Only includes claims with fraud_score >= 35 (Moderate or High risk).
        """
        claims = (
            self._db.query(ProcessedClaim)
            .filter(ProcessedClaim.fraud_score >= 35)
            .order_by(ProcessedClaim.fraud_score.desc())
            .all()
        )

        data = [
            FraudFlaggedClaim(
                claim_id=c.claim_id,
                policy_id=c.policy_id,
                customer_id=c.customer_id,
                claim_type=c.claim_type,
                claim_amount=c.claim_amount,
                fraud_probability=c.fraud_score or 0,
                risk_status=c.risk_status or "Unknown",
                recommendation=self._get_recommendation(c.fraud_score or 0),
                incident_date=c.incident_date,
            )
            for c in claims
        ]

        high_risk = sum(1 for d in data if d.fraud_probability >= 60)
        moderate_risk = sum(1 for d in data if 35 <= d.fraud_probability < 60)

        logger.info(
            "Fraud-flagged: %d total (%d high, %d moderate)",
            len(data), high_risk, moderate_risk,
        )

        return FraudFlaggedResponse(
            data=data,
            total_flagged=len(data),
            high_risk_count=high_risk,
            moderate_risk_count=moderate_risk,
        )

    # ═══════════════════════════════════════════════════════════
    #  TOP AGENTS — Bar Chart
    # ═══════════════════════════════════════════════════════════

    def get_top_agents(self, limit: int = 10) -> TopAgentsResponse:
        """
        Get top-performing agents by total premium collected.

        Returns data for the Agent Leaderboard bar chart.

        Args:
            limit: Maximum number of agents to return (default 10).
        """
        agents = (
            self._db.query(ProcessedAgent)
            .order_by(ProcessedAgent.total_premium_collected.desc())
            .limit(limit)
            .all()
        )

        data = [
            TopAgent(
                agent_id=a.agent_id,
                agent_name=a.agent_name,
                region=a.region,
                total_premium_collected=a.total_premium_collected,
                policies_sold=a.policies_sold,
                claims_ratio=(
                    round(a.claims_filed / a.policies_sold, 2)
                    if a.policies_sold > 0 else 0.0
                ),
            )
            for a in agents
        ]

        logger.info("Top agents: returning %d agents", len(data))
        return TopAgentsResponse(data=data)

    # ═══════════════════════════════════════════════════════════
    #  LOSS RATIO — Grouped Bar Chart
    # ═══════════════════════════════════════════════════════════

    def get_loss_ratio(self) -> LossRatioResponse:
        """
        Compute loss ratio by product type.

        Loss Ratio = (Total Claims Paid / Total Premium Collected) × 100

        Uses processed claims and policies tables to compute premiums
        earned and claims paid per product type.
        """
        # Get premium by product type
        policies = self._db.query(ProcessedPolicy).all()
        premium_by_product: dict[str, float] = defaultdict(float)
        for p in policies:
            premium_by_product[p.product_type] += p.premium_amount

        # Get claims paid by product type (settled claims only)
        claims = (
            self._db.query(ProcessedClaim)
            .filter(ProcessedClaim.status == "settled")
            .all()
        )

        # Map claim_type to product_type
        claim_to_product = {
            "motor_accident": "Motor",
            "health": "Health",
            "property_damage": "Property",
            "life": "Life",
        }

        claims_by_product: dict[str, float] = defaultdict(float)
        for c in claims:
            product = claim_to_product.get(c.claim_type, c.claim_type)
            claims_by_product[product] += c.claim_amount

        # Compute loss ratio for each product
        all_products = set(premium_by_product.keys()) | set(claims_by_product.keys())
        data = []
        total_premium = 0.0
        total_claims = 0.0

        for product in sorted(all_products):
            premium = premium_by_product.get(product, 0)
            claims_paid = claims_by_product.get(product, 0)
            ratio = round((claims_paid / premium * 100), 2) if premium > 0 else 0.0

            data.append(LossRatioItem(
                product_type=product,
                premium_collected=round(premium, 2),
                claims_paid=round(claims_paid, 2),
                loss_ratio=ratio,
            ))

            total_premium += premium
            total_claims += claims_paid

        overall = round((total_claims / total_premium * 100), 2) if total_premium > 0 else 0.0

        logger.info("Loss ratio computed for %d product types", len(data))

        return LossRatioResponse(data=data, overall_loss_ratio=overall)

    # ═══════════════════════════════════════════════════════════
    #  RENEWAL RATE — Area Chart
    # ═══════════════════════════════════════════════════════════

    def get_renewal_rate(self) -> RenewalRateResponse:
        """
        Compute monthly policy renewal rate trends.

        Groups policies by end_date month and counts renewed vs lapsed.
        """
        policies = self._db.query(ProcessedPolicy).all()

        monthly: dict[str, dict[str, int]] = defaultdict(
            lambda: {"total": 0, "renewed": 0, "lapsed": 0}
        )

        for p in policies:
            try:
                month = p.end_date[:7] if p.end_date else "Unknown"
            except (TypeError, IndexError):
                month = "Unknown"

            monthly[month]["total"] += 1
            if p.status == "renewed":
                monthly[month]["renewed"] += 1
            elif p.status == "lapsed":
                monthly[month]["lapsed"] += 1

        sorted_months = sorted(monthly.keys())
        data = []
        total_renewed = 0
        total_policies_count = 0

        for month in sorted_months:
            m = monthly[month]
            rate = round((m["renewed"] / m["total"] * 100), 2) if m["total"] > 0 else 0.0
            data.append(RenewalRateItem(
                month=month,
                total_policies=m["total"],
                renewed=m["renewed"],
                lapsed=m["lapsed"],
                renewal_rate=rate,
            ))
            total_renewed += m["renewed"]
            total_policies_count += m["total"]

        avg_rate = (
            round((total_renewed / total_policies_count * 100), 2)
            if total_policies_count > 0 else 0.0
        )

        logger.info("Renewal rate: %d months, avg %.1f%%", len(data), avg_rate)

        return RenewalRateResponse(data=data, avg_renewal_rate=avg_rate)

    # ═══════════════════════════════════════════════════════════
    #  DASHBOARD SUMMARY — KPI Cards
    # ═══════════════════════════════════════════════════════════

    def get_dashboard_summary(self) -> DashboardSummary:
        """
        Compute aggregate KPIs for the main dashboard header.

        Returns counts, totals, and rates for quick executive overview.
        """
        # ── Claims stats ───────────────────────────────────────
        all_claims = self._db.query(ProcessedClaim).all()
        total_claims = len(all_claims)
        pending = sum(1 for c in all_claims if c.status == "pending")
        settled = sum(1 for c in all_claims if c.status == "settled")
        rejected = sum(1 for c in all_claims if c.status == "rejected")
        fraud_flagged = sum(1 for c in all_claims if (c.fraud_score or 0) >= 60)
        total_claims_paid = sum(
            c.claim_amount for c in all_claims if c.status == "settled"
        )

        settlement_rate = round((settled / total_claims * 100), 2) if total_claims > 0 else 0.0

        # Estimate average processing days (random realistic range for demo)
        avg_processing = 12.5  # Placeholder — would compute from actual dates in production

        # ── Policy stats ───────────────────────────────────────
        all_policies = self._db.query(ProcessedPolicy).all()
        total_policies = len(all_policies)
        active_policies = sum(1 for p in all_policies if p.status == "active")
        total_premium = sum(p.premium_amount for p in all_policies)

        # ── Agent stats ────────────────────────────────────────
        all_agents = self._db.query(ProcessedAgent).all()
        active_agents = len(all_agents)

        # ── Customer count (approximate from unique customer_ids) ──
        customer_ids = set()
        for c in all_claims:
            customer_ids.add(c.customer_id)
        for p in all_policies:
            customer_ids.add(p.customer_id)
        total_customers = len(customer_ids)

        summary = DashboardSummary(
            total_policies=total_policies,
            active_policies=active_policies,
            total_claims=total_claims,
            pending_claims=pending,
            settled_claims=settled,
            rejected_claims=rejected,
            fraud_flagged_claims=fraud_flagged,
            total_premium_collected=round(total_premium, 2),
            total_claims_paid=round(total_claims_paid, 2),
            settlement_rate=settlement_rate,
            avg_processing_days=avg_processing,
            active_agents=active_agents,
            total_customers=total_customers,
        )

        logger.info(
            "Dashboard summary: %d policies, %d claims, %d fraud-flagged",
            total_policies, total_claims, fraud_flagged,
        )

        return summary

    # ═══════════════════════════════════════════════════════════
    #  HELPERS
    # ═══════════════════════════════════════════════════════════

    @staticmethod
    def _get_recommendation(fraud_score: float) -> str:
        """Generate recommendation text based on fraud score."""
        if fraud_score >= 60:
            return (
                "Request additional documents and surveyor re-inspection. "
                "Escalate to senior claims manager."
            )
        elif fraud_score >= 35:
            return (
                "Request supporting documents. "
                "Verify claim details with the assigned surveyor."
            )
        else:
            return "Proceed with standard settlement workflow."
