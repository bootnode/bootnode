"""Billing API - Usage tracking and subscription management."""

import json
import uuid
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

from bootnode.api.deps import DbDep, ProjectDep
from bootnode.core.billing import (
    TIER_LIMITS,
    Invoice,
    PricingTier,
    UsageSummary,
    billing_service,
    commerce_client,
    get_tier_limits,
    usage_sync_worker,
    usage_tracker,
    webhook_handler,
)
from bootnode.db.models import Subscription

router = APIRouter()


# =============================================================================
# Request/Response Models
# =============================================================================


class UsageResponse(BaseModel):
    """Current usage response."""

    project_id: uuid.UUID
    tier: str
    current_cu: int
    limit_cu: int
    remaining_cu: int | None
    percentage_used: float
    rate_limit_per_second: int
    billing_cycle_start: datetime | None
    billing_cycle_end: datetime | None


class UsageSummaryResponse(BaseModel):
    """Usage summary response."""

    project_id: uuid.UUID
    period_start: date
    period_end: date
    total_cu: int
    total_requests: int
    cu_by_method: dict[str, int]
    cu_by_chain: dict[str, int]
    daily_usage: list[dict[str, Any]]
    estimated_cost_cents: int

    class Config:
        from_attributes = True


class SubscriptionResponse(BaseModel):
    """Subscription response."""

    id: uuid.UUID
    project_id: uuid.UUID
    tier: str
    monthly_cu_limit: int
    rate_limit_per_second: int
    max_apps: int
    max_webhooks: int
    current_cu_used: int
    billing_cycle_start: datetime
    billing_cycle_end: datetime
    scheduled_tier: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TierResponse(BaseModel):
    """Pricing tier response."""

    name: str
    monthly_cu: int
    rate_limit_per_second: int
    max_apps: int
    max_webhooks: int
    price_per_million_cu: int
    features: list[str]


class UpgradeRequest(BaseModel):
    """Upgrade subscription request."""

    tier: PricingTier
    hanzo_subscription_id: str | None = None


class InvoiceResponse(BaseModel):
    """Invoice response."""

    id: uuid.UUID
    project_id: uuid.UUID
    period_start: date
    period_end: date
    total_cu: int
    tier: str
    base_cost_cents: int
    overage_cost_cents: int
    total_cost_cents: int
    status: str
    hanzo_invoice_id: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class LimitsCheckResponse(BaseModel):
    """Limits check response."""

    tier: str
    quota_ok: bool
    rate_allowed: bool
    rate_remaining: int
    current_cu: int
    limit_cu: int
    remaining_cu: int | None
    percentage_used: float
    rate_limit_per_second: int


# =============================================================================
# Endpoints
# =============================================================================


@router.get("/usage", response_model=UsageResponse)
async def get_usage(
    project: ProjectDep,
    db: DbDep,
) -> UsageResponse:
    """Get current compute unit usage for the project."""
    subscription = await billing_service.get_or_create_subscription(project.id, db)
    tier = PricingTier(subscription.tier)

    stats = await usage_tracker.get_usage_stats(project.id, tier)

    return UsageResponse(
        project_id=project.id,
        tier=subscription.tier,
        current_cu=stats["current_cu"],
        limit_cu=stats["limit_cu"],
        remaining_cu=stats["remaining_cu"],
        percentage_used=stats["percentage_used"],
        rate_limit_per_second=stats["rate_limit_per_second"],
        billing_cycle_start=subscription.billing_cycle_start,
        billing_cycle_end=subscription.billing_cycle_end,
    )


@router.get("/usage/summary", response_model=UsageSummaryResponse)
async def get_usage_summary(
    project: ProjectDep,
    db: DbDep,
    year: int | None = None,
    month: int | None = None,
) -> UsageSummary:
    """Get detailed usage summary for a billing period.

    If year/month not specified, returns current billing period.
    """
    period = date(year, month, 1) if year and month else date.today().replace(day=1)
    return await billing_service.get_usage_summary(project.id, period, db)


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    project: ProjectDep,
    db: DbDep,
) -> Subscription:
    """Get subscription details for the project."""
    subscription = await billing_service.get_or_create_subscription(project.id, db)
    return subscription


@router.post("/subscription/upgrade", response_model=SubscriptionResponse)
async def upgrade_subscription(
    request: UpgradeRequest,
    project: ProjectDep,
    db: DbDep,
) -> Subscription:
    """Upgrade subscription to a new tier.

    For paid tiers, a hanzo_subscription_id from Hanzo Commerce is required.
    """
    current = await billing_service.get_or_create_subscription(project.id, db)
    current_tier = PricingTier(current.tier)

    # Validate upgrade path
    tier_order = [PricingTier.FREE, PricingTier.PAY_AS_YOU_GO, PricingTier.GROWTH, PricingTier.ENTERPRISE]
    current_idx = tier_order.index(current_tier)
    new_idx = tier_order.index(request.tier)

    if new_idx < current_idx:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use /subscription/downgrade for tier downgrades",
        )

    if new_idx == current_idx:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already on this tier",
        )

    # Require payment info for paid tiers
    if request.tier != PricingTier.FREE and not request.hanzo_subscription_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="hanzo_subscription_id required for paid tiers",
        )

    return await billing_service.upgrade_tier(
        project.id,
        request.tier,
        db,
        hanzo_subscription_id=request.hanzo_subscription_id,
    )


@router.post("/subscription/downgrade", response_model=SubscriptionResponse)
async def downgrade_subscription(
    request: UpgradeRequest,
    project: ProjectDep,
    db: DbDep,
) -> Subscription:
    """Schedule a subscription downgrade.

    Downgrade takes effect at the end of the current billing period.
    """
    current = await billing_service.get_or_create_subscription(project.id, db)
    current_tier = PricingTier(current.tier)

    tier_order = [PricingTier.FREE, PricingTier.PAY_AS_YOU_GO, PricingTier.GROWTH, PricingTier.ENTERPRISE]
    current_idx = tier_order.index(current_tier)
    new_idx = tier_order.index(request.tier)

    if new_idx >= current_idx:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use /subscription/upgrade for tier upgrades",
        )

    return await billing_service.downgrade_tier(project.id, request.tier, db)


@router.get("/invoices", response_model=list[InvoiceResponse])
async def get_invoices(
    project: ProjectDep,
    db: DbDep,
    limit: int = 12,
) -> list[Invoice]:
    """Get invoices for the project."""
    return await billing_service.get_invoices(project.id, db, limit=limit)


@router.get("/tiers", response_model=list[TierResponse])
async def get_tiers() -> list[TierResponse]:
    """Get available pricing tiers."""
    return [
        TierResponse(
            name=tier.value,
            monthly_cu=limits.monthly_cu,
            rate_limit_per_second=limits.rate_limit_per_second,
            max_apps=limits.max_apps,
            max_webhooks=limits.max_webhooks,
            price_per_million_cu=limits.price_per_million_cu,
            features=limits.features,
        )
        for tier, limits in TIER_LIMITS.items()
    ]


@router.get("/tiers/{tier_name}", response_model=TierResponse)
async def get_tier(tier_name: str) -> TierResponse:
    """Get details for a specific pricing tier."""
    try:
        tier = PricingTier(tier_name)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown tier: {tier_name}",
        )

    limits = get_tier_limits(tier)
    return TierResponse(
        name=tier.value,
        monthly_cu=limits.monthly_cu,
        rate_limit_per_second=limits.rate_limit_per_second,
        max_apps=limits.max_apps,
        max_webhooks=limits.max_webhooks,
        price_per_million_cu=limits.price_per_million_cu,
        features=limits.features,
    )


@router.get("/limits", response_model=LimitsCheckResponse)
async def check_limits(
    project: ProjectDep,
    db: DbDep,
) -> LimitsCheckResponse:
    """Check current limits and quotas for the project."""
    result = await billing_service.check_limits(project.id, db)
    return LimitsCheckResponse(**result)


# =============================================================================
# Hanzo Commerce Integration
# =============================================================================


class CommerceInvoiceResponse(BaseModel):
    """Commerce invoice response."""

    id: str
    customer_id: str
    subscription_id: str | None
    status: str
    amount_due: int
    amount_paid: int
    currency: str
    period_start: datetime | None
    period_end: datetime | None
    paid_at: datetime | None
    hosted_invoice_url: str | None
    pdf_url: str | None
    created_at: datetime


class SyncStatusResponse(BaseModel):
    """Usage sync status response."""

    running: bool
    interval_seconds: int
    last_sync: str | None
    lock_held: bool


@router.post("/webhooks/commerce")
async def commerce_webhook(request: Request) -> dict:
    """
    Handle Hanzo Commerce webhooks.

    Processes subscription lifecycle events, invoice events, etc.
    Verifies HMAC-SHA256 signature before processing.
    """
    payload = await request.body()
    signature = request.headers.get("X-Commerce-Signature", "")

    # Verify signature
    if not webhook_handler.verify_signature(payload, signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature",
        )

    # Parse and handle event
    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )

    result = await webhook_handler.handle_event(event)
    return {"received": True, **result}


@router.get("/commerce/invoices", response_model=list[CommerceInvoiceResponse])
async def get_commerce_invoices(
    project: ProjectDep,
    db: DbDep,
    limit: int = 10,
) -> list[CommerceInvoiceResponse]:
    """
    Get invoices from Hanzo Commerce.

    Returns invoices for the project's Commerce customer.
    """
    subscription = await billing_service.get_subscription(project.id, db)

    if not subscription or not subscription.hanzo_customer_id:
        return []

    try:
        invoices = await commerce_client.get_customer_invoices(
            subscription.hanzo_customer_id,
            limit=limit,
        )
        return [
            CommerceInvoiceResponse(
                id=inv.id,
                customer_id=inv.customer_id,
                subscription_id=inv.subscription_id,
                status=inv.status.value,
                amount_due=inv.amount_due,
                amount_paid=inv.amount_paid,
                currency=inv.currency,
                period_start=inv.period_start,
                period_end=inv.period_end,
                paid_at=inv.paid_at,
                hosted_invoice_url=inv.hosted_invoice_url,
                pdf_url=inv.pdf_url,
                created_at=inv.created_at,
            )
            for inv in invoices
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch invoices from Commerce: {str(e)}",
        )


@router.post("/commerce/sync")
async def sync_usage(
    project: ProjectDep,
) -> dict:
    """
    Manually sync usage to Hanzo Commerce.

    Useful before subscription changes to ensure all usage is reported.
    """
    result = await usage_sync_worker.sync_project(project.id)
    return result


@router.get("/commerce/sync/status", response_model=SyncStatusResponse)
async def get_sync_status() -> SyncStatusResponse:
    """Get usage sync worker status."""
    status_data = await usage_sync_worker.get_status()
    return SyncStatusResponse(**status_data)


# =============================================================================
# Unified IAM + Commerce Endpoints
# =============================================================================

from bootnode.core.iam import IAMUser, get_current_user
from bootnode.core.billing.unified import (
    UnifiedUser,
    get_unified_billing_client,
)
from fastapi import Depends


class UnifiedUserResponse(BaseModel):
    """Unified user with IAM and Commerce data."""

    iam_id: str
    email: str
    name: str
    org: str
    commerce_customer_id: str | None
    stripe_customer_id: str | None
    has_payment_method: bool
    default_payment_method: str | None


class PaymentMethodResponse(BaseModel):
    """Payment method response."""

    id: str
    type: str
    brand: str | None
    last4: str | None
    exp_month: int | None
    exp_year: int | None
    is_default: bool


@router.get("/account", response_model=UnifiedUserResponse)
async def get_billing_account(
    user: IAMUser = Depends(get_current_user),
) -> UnifiedUserResponse:
    """Get unified billing account for authenticated user.

    Auto-creates Commerce customer if not exists, linking to IAM user.
    This is the main entry point for users accessing billing.
    """
    client = get_unified_billing_client()
    unified = await client.get_or_create_customer(user)

    return UnifiedUserResponse(
        iam_id=unified.iam_id,
        email=unified.email,
        name=unified.name,
        org=unified.org,
        commerce_customer_id=unified.commerce_customer_id,
        stripe_customer_id=unified.stripe_customer_id,
        has_payment_method=unified.has_payment_method,
        default_payment_method=unified.default_payment_method,
    )


@router.get("/account/subscriptions")
async def get_account_subscriptions(
    user: IAMUser = Depends(get_current_user),
) -> list[dict]:
    """Get all subscriptions for authenticated user across Commerce."""
    client = get_unified_billing_client()
    return await client.get_customer_subscriptions(user)


@router.get("/account/invoices")
async def get_account_invoices(
    user: IAMUser = Depends(get_current_user),
) -> list[dict]:
    """Get all invoices for authenticated user."""
    client = get_unified_billing_client()
    return await client.get_customer_invoices(user)


@router.get("/account/payment-methods", response_model=list[PaymentMethodResponse])
async def get_account_payment_methods(
    user: IAMUser = Depends(get_current_user),
) -> list[PaymentMethodResponse]:
    """Get payment methods for authenticated user."""
    client = get_unified_billing_client()
    methods = await client.get_customer_payment_methods(user)

    return [
        PaymentMethodResponse(
            id=m.get("id", ""),
            type=m.get("type", "card"),
            brand=m.get("card", {}).get("brand"),
            last4=m.get("card", {}).get("last4"),
            exp_month=m.get("card", {}).get("exp_month"),
            exp_year=m.get("card", {}).get("exp_year"),
            is_default=m.get("is_default", False),
        )
        for m in methods
    ]


@router.post("/account/sync")
async def sync_iam_to_commerce(
    user: IAMUser = Depends(get_current_user),
) -> dict:
    """Sync IAM user data to Commerce customer.

    Updates Commerce with latest IAM profile data.
    """
    client = get_unified_billing_client()
    result = await client.sync_iam_to_commerce(user)
    return {"synced": True, "customer": result}


@router.post("/account/subscribe")
async def create_account_subscription(
    plan_id: str,
    project: ProjectDep,
    user: IAMUser = Depends(get_current_user),
) -> dict:
    """Create subscription for authenticated user.

    Links the subscription to both the IAM user (via Commerce)
    and the bootnode project.
    """
    client = get_unified_billing_client()
    result = await client.create_subscription(user, plan_id, project.id)
    return result
