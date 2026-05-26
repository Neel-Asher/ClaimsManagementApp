"""
services/notification_client.py
================================
HTTP client for communicating with the Node.js Notification Service.

This module provides methods to send fraud alerts and other events
to the notification service via HTTP POST requests.

The notification service handles:
- Real-time notifications via Socket.IO
- Email notifications
- SMS alerts
- Database logging of all events

Usage:
    from services.notification_client import get_notification_client
    
    client = get_notification_client()
    await client.send_fraud_alert(
        claim_id="CLM-001",
        fraud_probability=72.5,
        risk_status="HIGH_RISK",
        claims_manager_id=5,
    )

Configuration:
    Set NOTIFICATION_SERVICE_URL in your .env file
    Default: http://localhost:5001
"""

import logging
from functools import lru_cache
from typing import Optional

import httpx
from config import get_settings

logger = logging.getLogger(__name__)


class NotificationClient:
    """HTTP client for the Node.js Notification Service."""

    def __init__(self, base_url: str, timeout: float = 10.0):
        """
        Initialize the notification client.

        Args:
            base_url: Base URL of the notification service (e.g., http://localhost:5001)
            timeout: HTTP request timeout in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def send_fraud_alert(
        self,
        claim_id: str,
        fraud_probability: float,
        risk_status: str,
        claims_manager_id: int,
    ) -> dict:
        """
        Send a fraud alert to the notification service.

        Called by the fraud detection router when a HIGH_RISK claim is detected.

        Args:
            claim_id: Unique claim identifier
            fraud_probability: Fraud score (0-100)
            risk_status: Risk level (LOW_RISK, MODERATE_RISK, HIGH_RISK)
            claims_manager_id: ID of the claims manager to notify

        Returns:
            Response from the notification service

        Raises:
            httpx.HTTPError: If the request fails
        """
        payload = {
            "claimId": claim_id,
            "fraudProbability": fraud_probability,
            "riskStatus": risk_status,
            "claimsManagerId": claims_manager_id,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/internal/events/fraud-alert",
                    json=payload,
                )
                response.raise_for_status()

                logger.info(
                    "[NOTIFICATION CLIENT] ✅ Fraud alert sent for claim %s (prob: %.1f%%)",
                    claim_id,
                    fraud_probability,
                )
                return response.json()

        except httpx.HTTPError as http_error:
            logger.error(
                "[NOTIFICATION CLIENT] ❌ HTTP error sending fraud alert: %s",
                str(http_error),
            )
            raise

        except Exception as error:
            logger.error(
                "[NOTIFICATION CLIENT] ❌ Error sending fraud alert: %s",
                str(error),
            )
            raise

    async def send_claim_filed(
        self,
        claim_id: str,
        customer_id: int,
        claims_manager_id: int,
        claim_type: str,
        claim_amount: float,
    ) -> dict:
        """
        Send a claim filed event notification.

        Args:
            claim_id: Unique claim identifier
            customer_id: ID of the customer who filed the claim
            claims_manager_id: ID of the assigned claims manager
            claim_type: Type of claim (auto, home, health, etc.)
            claim_amount: Amount claimed

        Returns:
            Response from the notification service
        """
        payload = {
            "claimId": claim_id,
            "customerId": customer_id,
            "claimsManagerId": claims_manager_id,
            "claimType": claim_type,
            "claimAmount": claim_amount,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/internal/events/claim-filed",
                    json=payload,
                )
                response.raise_for_status()

                logger.info(
                    "[NOTIFICATION CLIENT] ✅ Claim filed notification sent for %s",
                    claim_id,
                )
                return response.json()

        except httpx.HTTPError as http_error:
            logger.error(
                "[NOTIFICATION CLIENT] ❌ HTTP error sending claim filed event: %s",
                str(http_error),
            )
            raise

        except Exception as error:
            logger.error(
                "[NOTIFICATION CLIENT] ❌ Error sending claim filed event: %s",
                str(error),
            )
            raise

    async def send_claim_status_updated(
        self,
        claim_id: str,
        customer_id: int,
        agent_id: int,
        status: str,
        remarks: Optional[str] = None,
    ) -> dict:
        """
        Send a claim status updated event notification.

        Args:
            claim_id: Unique claim identifier
            customer_id: ID of the customer
            agent_id: ID of the agent handling the claim
            status: New claim status (PENDING, APPROVED, REJECTED, SETTLED)
            remarks: Optional remarks about the status change

        Returns:
            Response from the notification service
        """
        payload = {
            "claimId": claim_id,
            "customerId": customer_id,
            "agentId": agent_id,
            "status": status,
            "remarks": remarks,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/internal/events/claim-status-updated",
                    json=payload,
                )
                response.raise_for_status()

                logger.info(
                    "[NOTIFICATION CLIENT] ✅ Claim status notification sent for %s → %s",
                    claim_id,
                    status,
                )
                return response.json()

        except httpx.HTTPError as http_error:
            logger.error(
                "[NOTIFICATION CLIENT] ❌ HTTP error sending status update: %s",
                str(http_error),
            )
            raise

        except Exception as error:
            logger.error(
                "[NOTIFICATION CLIENT] ❌ Error sending status update: %s",
                str(error),
            )
            raise

    async def send_payment_received(
        self,
        claim_id: str,
        customer_id: int,
        amount: float,
    ) -> dict:
        """
        Send a payment received event notification.

        Args:
            claim_id: Unique claim identifier
            customer_id: ID of the customer
            amount: Amount paid

        Returns:
            Response from the notification service
        """
        payload = {
            "claimId": claim_id,
            "customerId": customer_id,
            "amount": amount,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/internal/events/payment-received",
                    json=payload,
                )
                response.raise_for_status()

                logger.info(
                    "[NOTIFICATION CLIENT] ✅ Payment notification sent for %s",
                    claim_id,
                )
                return response.json()

        except httpx.HTTPError as http_error:
            logger.error(
                "[NOTIFICATION CLIENT] ❌ HTTP error sending payment event: %s",
                str(http_error),
            )
            raise

        except Exception as error:
            logger.error(
                "[NOTIFICATION CLIENT] ❌ Error sending payment event: %s",
                str(error),
            )
            raise


# ═══════════════════════════════════════════════════════════════
#  SINGLETON INSTANCE
# ═══════════════════════════════════════════════════════════════


@lru_cache(maxsize=1)
def get_notification_client() -> NotificationClient:
    """
    Get or create the singleton NotificationClient instance.

    Settings are read from environment configuration:
    - NOTIFICATION_SERVICE_URL: Base URL of the notification service

    Returns:
        NotificationClient instance
    """
    settings = get_settings()
    notification_url = getattr(
        settings,
        "NOTIFICATION_SERVICE_URL",
        "http://localhost:5001",
    )
    return NotificationClient(base_url=notification_url)
