"""Hanzo Commerce client for subscription billing.

Integrates with Hanzo Commerce API (Stripe-based) for:
- Customer management
- Subscription lifecycle
- Usage metering (PAYG)
- Invoice retrieval
"""

from datetime import datetime
from typing import Any
from uuid import UUID

import httpx
import structlog

from bootnode.config import get_settings
from bootnode.core.billing.models import (
    Customer,
    Invoice,
    InvoiceStatus,
    PlanTier,
    Subscription,
    SubscriptionStatus,
)

logger = structlog.get_logger()


class CommerceError(Exception):
    """Error from Hanzo Commerce API."""

    def __init__(self, message: str, status_code: int = 500, details: Any = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


class HanzoCommerceClient:
    """Client for Hanzo Commerce billing API."""

    def __init__(self) -> None:
        settings = get_settings()
        self.base_url = settings.hanzo_commerce_url
        self.api_key = settings.hanzo_commerce_api_key
        self._timeout = httpx.Timeout(30.0)

    def _headers(self) -> dict[str, str]:
        """Get request headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Source": "bootnode",
        }

    async def _request(
        self,
        method: str,
        path: str,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict[str, Any]:
        """Make HTTP request to Commerce API."""
        url = f"{self.base_url}{path}"

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    json=json,
                    params=params,
                    headers=self._headers(),
                )

                if response.status_code >= 400:
                    error_data = response.json() if response.content else {}
                    logger.error(
                        "Commerce API error",
                        status=response.status_code,
                        path=path,
                        error=error_data,
                    )
                    raise CommerceError(
                        message=error_data.get("message", "Commerce API error"),
                        status_code=response.status_code,
                        details=error_data,
                    )

                return response.json() if response.content else {}

            except httpx.RequestError as e:
                logger.error("Commerce API request failed", path=path, error=str(e))
                raise CommerceError(
                    message=f"Failed to connect to Commerce API: {str(e)}",
                    status_code=503,
                )

    # =========================================================================
    # Customer Management
    # =========================================================================

    async def create_customer(
        self,
        user_id: str,
        email: str,
        name: str,
        org: str = "hanzo",
    ) -> str:
        """
        Create customer in Hanzo Commerce.
        Returns customer_id.
        """
        data = await self._request(
            "POST",
            "/api/v1/customers",
            json={
                "email": email,
                "name": name,
                "org": org,
                "metadata": {
                    "iam_id": user_id,
                    "source": "bootnode",
                },
            },
        )

        customer_id = data["id"]
        logger.info(
            "Customer created in Commerce",
            customer_id=customer_id,
            email=email,
            org=org,
        )
        return customer_id

    async def get_customer(self, customer_id: str) -> Customer:
        """Get customer by ID."""
        data = await self._request("GET", f"/api/v1/customers/{customer_id}")
        return Customer(
            id=data["id"],
            email=data["email"],
            name=data["name"],
            org=data.get("org", "hanzo"),
            metadata=data.get("metadata", {}),
            created_at=(
                datetime.fromisoformat(data["created_at"])
                if data.get("created_at")
                else None
            ),
        )

    async def get_customer_by_email(self, email: str) -> Customer | None:
        """Get customer by email."""
        try:
            data = await self._request(
                "GET",
                "/api/v1/customers",
                params={"email": email},
            )
            customers = data.get("data", [])
            if not customers:
                return None
            c = customers[0]
            return Customer(
                id=c["id"],
                email=c["email"],
                name=c["name"],
                org=c.get("org", "hanzo"),
                metadata=c.get("metadata", {}),
            )
        except CommerceError as e:
            if e.status_code == 404:
                return None
            raise

    async def update_customer(
        self,
        customer_id: str,
        email: str | None = None,
        name: str | None = None,
        metadata: dict | None = None,
    ) -> Customer:
        """Update customer details."""
        update_data = {}
        if email:
            update_data["email"] = email
        if name:
            update_data["name"] = name
        if metadata:
            update_data["metadata"] = metadata

        data = await self._request(
            "PATCH",
            f"/api/v1/customers/{customer_id}",
            json=update_data,
        )
        return Customer(
            id=data["id"],
            email=data["email"],
            name=data["name"],
            org=data.get("org", "hanzo"),
            metadata=data.get("metadata", {}),
        )

    # =========================================================================
    # Subscription Management
    # =========================================================================

    async def create_subscription(
        self,
        customer_id: str,
        plan_slug: str,
        project_id: UUID,
    ) -> Subscription:
        """
        Create subscription for a plan.
        Plans: bootnode-free, bootnode-payg, bootnode-enterprise
        """
        data = await self._request(
            "POST",
            "/api/v1/subscriptions",
            json={
                "customer_id": customer_id,
                "plan_slug": plan_slug,
                "metadata": {
                    "project_id": str(project_id),
                    "source": "bootnode",
                },
            },
        )

        subscription = Subscription(
            id=data["id"],
            customer_id=data["customer_id"],
            plan_slug=data["plan_slug"],
            status=SubscriptionStatus(data["status"]),
            current_period_start=datetime.fromisoformat(data["current_period_start"]),
            current_period_end=datetime.fromisoformat(data["current_period_end"]),
            cancel_at_period_end=data.get("cancel_at_period_end", False),
            metadata=data.get("metadata", {}),
            created_at=datetime.fromisoformat(data["created_at"]),
        )

        logger.info(
            "Subscription created",
            subscription_id=subscription.id,
            customer_id=customer_id,
            plan=plan_slug,
            project_id=str(project_id),
        )
        return subscription

    async def get_subscription(self, subscription_id: str) -> Subscription:
        """Get subscription by ID."""
        data = await self._request("GET", f"/api/v1/subscriptions/{subscription_id}")
        return Subscription(
            id=data["id"],
            customer_id=data["customer_id"],
            plan_slug=data["plan_slug"],
            status=SubscriptionStatus(data["status"]),
            current_period_start=datetime.fromisoformat(data["current_period_start"]),
            current_period_end=datetime.fromisoformat(data["current_period_end"]),
            cancel_at_period_end=data.get("cancel_at_period_end", False),
            cancelled_at=(
                datetime.fromisoformat(data["cancelled_at"])
                if data.get("cancelled_at")
                else None
            ),
            metadata=data.get("metadata", {}),
            created_at=datetime.fromisoformat(data["created_at"]),
        )

    async def get_subscriptions_by_customer(
        self, customer_id: str
    ) -> list[Subscription]:
        """Get all subscriptions for a customer."""
        data = await self._request(
            "GET",
            "/api/v1/subscriptions",
            params={"customer_id": customer_id},
        )
        return [
            Subscription(
                id=s["id"],
                customer_id=s["customer_id"],
                plan_slug=s["plan_slug"],
                status=SubscriptionStatus(s["status"]),
                current_period_start=datetime.fromisoformat(s["current_period_start"]),
                current_period_end=datetime.fromisoformat(s["current_period_end"]),
                cancel_at_period_end=s.get("cancel_at_period_end", False),
                metadata=s.get("metadata", {}),
                created_at=datetime.fromisoformat(s["created_at"]),
            )
            for s in data.get("data", [])
        ]

    async def update_subscription(
        self,
        subscription_id: str,
        plan_slug: str,
    ) -> Subscription:
        """Upgrade or downgrade subscription."""
        data = await self._request(
            "PATCH",
            f"/api/v1/subscriptions/{subscription_id}",
            json={"plan_slug": plan_slug},
        )

        logger.info(
            "Subscription updated",
            subscription_id=subscription_id,
            new_plan=plan_slug,
        )

        return Subscription(
            id=data["id"],
            customer_id=data["customer_id"],
            plan_slug=data["plan_slug"],
            status=SubscriptionStatus(data["status"]),
            current_period_start=datetime.fromisoformat(data["current_period_start"]),
            current_period_end=datetime.fromisoformat(data["current_period_end"]),
            cancel_at_period_end=data.get("cancel_at_period_end", False),
            metadata=data.get("metadata", {}),
            created_at=datetime.fromisoformat(data["created_at"]),
        )

    async def cancel_subscription(
        self,
        subscription_id: str,
        immediately: bool = False,
    ) -> bool:
        """
        Cancel subscription.
        If immediately=False, cancels at end of billing period.
        """
        data = await self._request(
            "POST",
            f"/api/v1/subscriptions/{subscription_id}/cancel",
            json={"immediately": immediately},
        )

        logger.info(
            "Subscription cancelled",
            subscription_id=subscription_id,
            immediately=immediately,
        )
        return data.get("cancelled", True)

    async def reactivate_subscription(self, subscription_id: str) -> Subscription:
        """Reactivate a cancelled subscription (if not yet expired)."""
        data = await self._request(
            "POST",
            f"/api/v1/subscriptions/{subscription_id}/reactivate",
        )
        return Subscription(
            id=data["id"],
            customer_id=data["customer_id"],
            plan_slug=data["plan_slug"],
            status=SubscriptionStatus(data["status"]),
            current_period_start=datetime.fromisoformat(data["current_period_start"]),
            current_period_end=datetime.fromisoformat(data["current_period_end"]),
            cancel_at_period_end=data.get("cancel_at_period_end", False),
            metadata=data.get("metadata", {}),
            created_at=datetime.fromisoformat(data["created_at"]),
        )

    # =========================================================================
    # Usage Metering (for PAYG)
    # =========================================================================

    async def report_usage(
        self,
        subscription_id: str,
        compute_units: int,
        timestamp: datetime,
        idempotency_key: str | None = None,
    ) -> None:
        """Report metered usage for PAYG billing."""
        await self._request(
            "POST",
            f"/api/v1/subscriptions/{subscription_id}/usage",
            json={
                "quantity": compute_units,
                "timestamp": timestamp.isoformat(),
                "action": "increment",
                "idempotency_key": idempotency_key,
            },
        )

        logger.debug(
            "Usage reported to Commerce",
            subscription_id=subscription_id,
            compute_units=compute_units,
        )

    async def get_usage_summary(
        self,
        subscription_id: str,
        period_start: datetime | None = None,
        period_end: datetime | None = None,
    ) -> dict:
        """Get usage summary for a subscription."""
        params = {}
        if period_start:
            params["period_start"] = period_start.isoformat()
        if period_end:
            params["period_end"] = period_end.isoformat()

        return await self._request(
            "GET",
            f"/api/v1/subscriptions/{subscription_id}/usage",
            params=params or None,
        )

    # =========================================================================
    # Invoices
    # =========================================================================

    async def get_customer_invoices(
        self,
        customer_id: str,
        limit: int = 10,
    ) -> list[Invoice]:
        """Get customer invoices."""
        data = await self._request(
            "GET",
            "/api/v1/invoices",
            params={"customer_id": customer_id, "limit": limit},
        )
        return [
            Invoice(
                id=inv["id"],
                customer_id=inv["customer_id"],
                subscription_id=inv.get("subscription_id"),
                status=InvoiceStatus(inv["status"]),
                amount_due=inv["amount_due"],
                amount_paid=inv["amount_paid"],
                currency=inv.get("currency", "usd"),
                period_start=(
                    datetime.fromisoformat(inv["period_start"])
                    if inv.get("period_start")
                    else None
                ),
                period_end=(
                    datetime.fromisoformat(inv["period_end"])
                    if inv.get("period_end")
                    else None
                ),
                paid_at=(
                    datetime.fromisoformat(inv["paid_at"])
                    if inv.get("paid_at")
                    else None
                ),
                hosted_invoice_url=inv.get("hosted_invoice_url"),
                pdf_url=inv.get("pdf_url"),
                created_at=datetime.fromisoformat(inv["created_at"]),
            )
            for inv in data.get("data", [])
        ]

    async def get_invoice(self, invoice_id: str) -> Invoice:
        """Get specific invoice."""
        inv = await self._request("GET", f"/api/v1/invoices/{invoice_id}")
        return Invoice(
            id=inv["id"],
            customer_id=inv["customer_id"],
            subscription_id=inv.get("subscription_id"),
            status=InvoiceStatus(inv["status"]),
            amount_due=inv["amount_due"],
            amount_paid=inv["amount_paid"],
            currency=inv.get("currency", "usd"),
            period_start=(
                datetime.fromisoformat(inv["period_start"])
                if inv.get("period_start")
                else None
            ),
            period_end=(
                datetime.fromisoformat(inv["period_end"])
                if inv.get("period_end")
                else None
            ),
            paid_at=(
                datetime.fromisoformat(inv["paid_at"]) if inv.get("paid_at") else None
            ),
            hosted_invoice_url=inv.get("hosted_invoice_url"),
            pdf_url=inv.get("pdf_url"),
            created_at=datetime.fromisoformat(inv["created_at"]),
        )

    async def get_upcoming_invoice(self, customer_id: str) -> Invoice | None:
        """Get upcoming invoice preview for a customer."""
        try:
            inv = await self._request(
                "GET",
                "/api/v1/invoices/upcoming",
                params={"customer_id": customer_id},
            )
            return Invoice(
                id=inv.get("id", "upcoming"),
                customer_id=inv["customer_id"],
                subscription_id=inv.get("subscription_id"),
                status=InvoiceStatus.DRAFT,
                amount_due=inv["amount_due"],
                amount_paid=0,
                currency=inv.get("currency", "usd"),
                period_start=(
                    datetime.fromisoformat(inv["period_start"])
                    if inv.get("period_start")
                    else None
                ),
                period_end=(
                    datetime.fromisoformat(inv["period_end"])
                    if inv.get("period_end")
                    else None
                ),
                created_at=datetime.now(),
            )
        except CommerceError as e:
            if e.status_code == 404:
                return None
            raise


# Global singleton
commerce_client = HanzoCommerceClient()
