"""Billing models for Hanzo Commerce integration."""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class PlanTier(str, Enum):
    """Subscription plan tiers."""

    FREE = "bootnode-free"
    PAYG = "bootnode-payg"
    ENTERPRISE = "bootnode-enterprise"


class SubscriptionStatus(str, Enum):
    """Subscription status values."""

    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    TRIALING = "trialing"
    PAUSED = "paused"


class InvoiceStatus(str, Enum):
    """Invoice status values."""

    DRAFT = "draft"
    OPEN = "open"
    PAID = "paid"
    VOID = "void"
    UNCOLLECTIBLE = "uncollectible"


class Customer(BaseModel):
    """Hanzo Commerce customer."""

    id: str
    email: str
    name: str
    org: str = "hanzo"
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None


class Subscription(BaseModel):
    """Hanzo Commerce subscription."""

    id: str
    customer_id: str
    plan_slug: str
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool = False
    cancelled_at: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class Invoice(BaseModel):
    """Hanzo Commerce invoice."""

    id: str
    customer_id: str
    subscription_id: str | None = None
    status: InvoiceStatus
    amount_due: int  # cents
    amount_paid: int  # cents
    currency: str = "usd"
    period_start: datetime | None = None
    period_end: datetime | None = None
    paid_at: datetime | None = None
    hosted_invoice_url: str | None = None
    pdf_url: str | None = None
    created_at: datetime


class UsageRecord(BaseModel):
    """Usage record for metered billing."""

    subscription_id: str
    quantity: int  # compute units
    timestamp: datetime
    action: str = "increment"  # increment or set
    idempotency_key: str | None = None


class PlanLimits(BaseModel):
    """Plan limits configuration."""

    requests_per_minute: int
    compute_units_per_minute: int
    compute_units_per_month: int
    webhooks_max: int
    api_keys_max: int
    team_members_max: int

    @classmethod
    def for_plan(cls, plan: PlanTier) -> "PlanLimits":
        """Get limits for a specific plan."""
        limits = {
            PlanTier.FREE: cls(
                requests_per_minute=100,
                compute_units_per_minute=1000,
                compute_units_per_month=100_000,
                webhooks_max=3,
                api_keys_max=2,
                team_members_max=1,
            ),
            PlanTier.PAYG: cls(
                requests_per_minute=1000,
                compute_units_per_minute=10_000,
                compute_units_per_month=10_000_000,  # soft limit, pay for overage
                webhooks_max=50,
                api_keys_max=20,
                team_members_max=10,
            ),
            PlanTier.ENTERPRISE: cls(
                requests_per_minute=10_000,
                compute_units_per_minute=100_000,
                compute_units_per_month=100_000_000,
                webhooks_max=500,
                api_keys_max=100,
                team_members_max=100,
            ),
        }
        return limits.get(plan, limits[PlanTier.FREE])


class ProjectBilling(BaseModel):
    """Project billing state."""

    project_id: UUID
    customer_id: str
    subscription_id: str | None = None
    plan: PlanTier = PlanTier.FREE
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    limits: PlanLimits = Field(default_factory=lambda: PlanLimits.for_plan(PlanTier.FREE))
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None


class WebhookEvent(BaseModel):
    """Commerce webhook event."""

    id: str
    type: str
    data: dict[str, Any]
    created_at: datetime
