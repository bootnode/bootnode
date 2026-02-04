"""Billing service for subscription management."""

import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any

import structlog
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from bootnode.core.billing.tiers import (
    PricingTier,
    TierLimits,
    calculate_monthly_cost,
    get_tier_limits,
)
from bootnode.core.billing.tracker import usage_tracker
from bootnode.core.datastore import datastore_client
from bootnode.db.models import Subscription

logger = structlog.get_logger()


class UsageSummary(BaseModel):
    """Usage summary for a billing period."""

    project_id: uuid.UUID
    period_start: date
    period_end: date
    total_cu: int
    total_requests: int
    cu_by_method: dict[str, int]
    cu_by_chain: dict[str, int]
    daily_usage: list[dict[str, Any]]
    estimated_cost_cents: int


class Invoice(BaseModel):
    """Invoice for a billing period."""

    id: uuid.UUID
    project_id: uuid.UUID
    period_start: date
    period_end: date
    total_cu: int
    tier: str
    base_cost_cents: int
    overage_cost_cents: int
    total_cost_cents: int
    status: str  # draft, pending, paid, overdue
    hanzo_invoice_id: str | None
    created_at: datetime


class BillingService:
    """Service for billing operations."""

    async def get_subscription(
        self,
        project_id: uuid.UUID,
        db: AsyncSession,
    ) -> Subscription | None:
        """Get subscription for a project.

        Args:
            project_id: The project ID
            db: Database session

        Returns:
            Subscription or None if not found
        """
        result = await db.execute(
            select(Subscription).where(Subscription.project_id == project_id)
        )
        return result.scalar_one_or_none()

    async def get_or_create_subscription(
        self,
        project_id: uuid.UUID,
        db: AsyncSession,
    ) -> Subscription:
        """Get or create subscription for a project.

        Args:
            project_id: The project ID
            db: Database session

        Returns:
            Subscription (existing or newly created)
        """
        subscription = await self.get_subscription(project_id, db)

        if subscription:
            return subscription

        # Create new free-tier subscription
        now = datetime.now(UTC)
        limits = get_tier_limits(PricingTier.FREE)

        subscription = Subscription(
            project_id=project_id,
            tier=PricingTier.FREE.value,
            monthly_cu_limit=limits.monthly_cu,
            rate_limit_per_second=limits.rate_limit_per_second,
            max_apps=limits.max_apps,
            max_webhooks=limits.max_webhooks,
            billing_cycle_start=now,
            billing_cycle_end=now + timedelta(days=30),
        )

        db.add(subscription)
        await db.commit()
        await db.refresh(subscription)

        logger.info(
            "Created subscription",
            project_id=str(project_id),
            tier=PricingTier.FREE.value,
        )

        return subscription

    async def get_tier(
        self,
        project_id: uuid.UUID,
        db: AsyncSession,
    ) -> PricingTier:
        """Get pricing tier for a project.

        Args:
            project_id: The project ID
            db: Database session

        Returns:
            The project's pricing tier
        """
        subscription = await self.get_subscription(project_id, db)
        if subscription:
            return PricingTier(subscription.tier)
        return PricingTier.FREE

    async def get_tier_limits_for_project(
        self,
        project_id: uuid.UUID,
        db: AsyncSession,
    ) -> TierLimits:
        """Get tier limits for a project.

        Args:
            project_id: The project ID
            db: Database session

        Returns:
            TierLimits for the project's tier
        """
        tier = await self.get_tier(project_id, db)
        return get_tier_limits(tier)

    async def get_usage_summary(
        self,
        project_id: uuid.UUID,
        period: date,
        db: AsyncSession,
    ) -> UsageSummary:
        """Get usage summary for a billing period.

        Args:
            project_id: The project ID
            period: The billing period (first day of month)
            db: Database session

        Returns:
            UsageSummary for the period
        """
        tier = await self.get_tier(project_id, db)

        # Calculate period bounds
        period_start = period.replace(day=1)
        if period.month == 12:
            period_end = period.replace(year=period.year + 1, month=1, day=1)
        else:
            period_end = period.replace(month=period.month + 1, day=1)

        # Default values if ClickHouse unavailable
        total_cu = 0
        total_requests = 0
        cu_by_method: dict[str, int] = {}
        cu_by_chain: dict[str, int] = {}
        daily_usage: list[dict[str, Any]] = []

        if datastore_client.is_connected:
            # Get total CU and requests
            total_result = await datastore_client.fetchone(
                """
                SELECT
                    sum(compute_units) as total_cu,
                    count() as total_requests
                FROM api_usage
                WHERE project_id = %(project_id)s
                  AND timestamp >= %(start)s
                  AND timestamp < %(end)s
                """,
                {
                    "project_id": str(project_id),
                    "start": period_start.isoformat(),
                    "end": period_end.isoformat(),
                },
            )

            if total_result:
                total_cu = int(total_result.get("total_cu") or 0)
                total_requests = int(total_result.get("total_requests") or 0)

            # Get CU by method
            method_result = await datastore_client.fetch(
                """
                SELECT method, sum(compute_units) as cu
                FROM api_usage
                WHERE project_id = %(project_id)s
                  AND timestamp >= %(start)s
                  AND timestamp < %(end)s
                GROUP BY method
                ORDER BY cu DESC
                LIMIT 20
                """,
                {
                    "project_id": str(project_id),
                    "start": period_start.isoformat(),
                    "end": period_end.isoformat(),
                },
            )
            cu_by_method = {row["method"]: int(row["cu"]) for row in method_result}

            # Get CU by chain
            chain_result = await datastore_client.fetch(
                """
                SELECT toString(chain_id) as chain, sum(compute_units) as cu
                FROM api_usage
                WHERE project_id = %(project_id)s
                  AND timestamp >= %(start)s
                  AND timestamp < %(end)s
                GROUP BY chain_id
                ORDER BY cu DESC
                """,
                {
                    "project_id": str(project_id),
                    "start": period_start.isoformat(),
                    "end": period_end.isoformat(),
                },
            )
            cu_by_chain = {row["chain"]: int(row["cu"]) for row in chain_result}

            # Get daily usage
            daily_result = await datastore_client.fetch(
                """
                SELECT
                    toDate(timestamp) as date,
                    sum(compute_units) as cu,
                    count() as requests
                FROM api_usage
                WHERE project_id = %(project_id)s
                  AND timestamp >= %(start)s
                  AND timestamp < %(end)s
                GROUP BY date
                ORDER BY date
                """,
                {
                    "project_id": str(project_id),
                    "start": period_start.isoformat(),
                    "end": period_end.isoformat(),
                },
            )
            daily_usage = [
                {
                    "date": str(row["date"]),
                    "cu": int(row["cu"]),
                    "requests": int(row["requests"]),
                }
                for row in daily_result
            ]
        else:
            # Fall back to Redis for current period
            total_cu = await usage_tracker.get_current_usage(project_id)

        # Calculate estimated cost
        estimated_cost = calculate_monthly_cost(tier, total_cu)

        return UsageSummary(
            project_id=project_id,
            period_start=period_start,
            period_end=period_end,
            total_cu=total_cu,
            total_requests=total_requests,
            cu_by_method=cu_by_method,
            cu_by_chain=cu_by_chain,
            daily_usage=daily_usage,
            estimated_cost_cents=estimated_cost,
        )

    async def upgrade_tier(
        self,
        project_id: uuid.UUID,
        tier: PricingTier,
        db: AsyncSession,
        hanzo_subscription_id: str | None = None,
    ) -> Subscription:
        """Upgrade a project to a new tier.

        Args:
            project_id: The project ID
            tier: The new pricing tier
            db: Database session
            hanzo_subscription_id: Hanzo Commerce subscription ID

        Returns:
            Updated subscription
        """
        subscription = await self.get_or_create_subscription(project_id, db)
        limits = get_tier_limits(tier)

        # Update subscription
        subscription.tier = tier.value
        subscription.monthly_cu_limit = limits.monthly_cu
        subscription.rate_limit_per_second = limits.rate_limit_per_second
        subscription.max_apps = limits.max_apps
        subscription.max_webhooks = limits.max_webhooks

        if hanzo_subscription_id:
            subscription.hanzo_subscription_id = hanzo_subscription_id

        await db.commit()
        await db.refresh(subscription)

        logger.info(
            "Upgraded subscription",
            project_id=str(project_id),
            tier=tier.value,
        )

        return subscription

    async def downgrade_tier(
        self,
        project_id: uuid.UUID,
        tier: PricingTier,
        db: AsyncSession,
    ) -> Subscription:
        """Downgrade a project to a lower tier.

        Note: Downgrade takes effect at end of billing period.

        Args:
            project_id: The project ID
            tier: The new pricing tier
            db: Database session

        Returns:
            Updated subscription
        """
        subscription = await self.get_or_create_subscription(project_id, db)

        # Schedule downgrade for end of billing period
        subscription.scheduled_tier = tier.value

        await db.commit()
        await db.refresh(subscription)

        logger.info(
            "Scheduled downgrade",
            project_id=str(project_id),
            current_tier=subscription.tier,
            new_tier=tier.value,
            effective_date=str(subscription.billing_cycle_end),
        )

        return subscription

    async def get_invoices(
        self,
        project_id: uuid.UUID,
        _db: AsyncSession,  # Unused, kept for API consistency
        limit: int = 12,
    ) -> list[Invoice]:
        """Get invoices for a project.

        Args:
            project_id: The project ID
            db: Database session
            limit: Maximum number of invoices to return

        Returns:
            List of invoices (most recent first)
        """
        if not datastore_client.is_connected:
            return []

        result = await datastore_client.fetch(
            """
            SELECT *
            FROM billing_invoices
            WHERE project_id = %(project_id)s
            ORDER BY created_at DESC
            LIMIT %(limit)s
            """,
            {"project_id": str(project_id), "limit": limit},
        )

        return [
            Invoice(
                id=uuid.UUID(row["id"]),
                project_id=uuid.UUID(row["project_id"]),
                period_start=row["period_start"],
                period_end=row["period_end"],
                total_cu=row["total_cu"],
                tier=row["tier"],
                base_cost_cents=row["base_cost_cents"],
                overage_cost_cents=row["overage_cost_cents"],
                total_cost_cents=row["total_cost_cents"],
                status=row["status"],
                hanzo_invoice_id=row.get("hanzo_invoice_id"),
                created_at=row["created_at"],
            )
            for row in result
        ]

    async def check_limits(
        self,
        project_id: uuid.UUID,
        db: AsyncSession,
    ) -> dict[str, Any]:
        """Check all limits for a project.

        Args:
            project_id: The project ID
            db: Database session

        Returns:
            Dict with limit check results
        """
        subscription = await self.get_or_create_subscription(project_id, db)
        tier = PricingTier(subscription.tier)

        # Get current usage from Redis
        usage_stats = await usage_tracker.get_usage_stats(project_id, tier)

        # Check rate limit
        rate_allowed, rate_remaining = await usage_tracker.check_rate_limit(
            project_id, tier
        )

        # Check quota
        quota_ok = await usage_tracker.check_quota(project_id, tier)

        return {
            "tier": tier.value,
            "quota_ok": quota_ok,
            "rate_allowed": rate_allowed,
            "rate_remaining": rate_remaining,
            **usage_stats,
        }


# Global singleton
billing_service = BillingService()
