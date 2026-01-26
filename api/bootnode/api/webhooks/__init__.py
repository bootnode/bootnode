"""Webhooks API - Event-driven notifications."""

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select

from bootnode.api.deps import ApiKeyDep, DbDep, ProjectDep
from bootnode.db.models import Webhook, WebhookDelivery
from bootnode.core.chains import ChainRegistry

router = APIRouter()


class WebhookEventType:
    """Supported webhook event types."""

    ADDRESS_ACTIVITY = "ADDRESS_ACTIVITY"
    MINED_TRANSACTION = "MINED_TRANSACTION"
    NFT_ACTIVITY = "NFT_ACTIVITY"
    TOKEN_TRANSFER = "TOKEN_TRANSFER"
    INTERNAL_TRANSFER = "INTERNAL_TRANSFER"
    NEW_BLOCK = "NEW_BLOCK"
    PENDING_TRANSACTION = "PENDING_TRANSACTION"


VALID_EVENT_TYPES = {
    WebhookEventType.ADDRESS_ACTIVITY,
    WebhookEventType.MINED_TRANSACTION,
    WebhookEventType.NFT_ACTIVITY,
    WebhookEventType.TOKEN_TRANSFER,
    WebhookEventType.INTERNAL_TRANSFER,
    WebhookEventType.NEW_BLOCK,
    WebhookEventType.PENDING_TRANSACTION,
}


class CreateWebhookRequest(BaseModel):
    """Create webhook request."""

    name: str
    url: HttpUrl
    chain: str
    network: str = "mainnet"
    event_type: str
    filters: dict[str, Any] | None = None


class WebhookResponse(BaseModel):
    """Webhook response."""

    id: uuid.UUID
    name: str
    url: str
    chain: str
    network: str
    event_type: str
    filters: dict[str, Any] | None
    is_active: bool
    failure_count: int
    last_triggered_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class WebhookDeliveryResponse(BaseModel):
    """Webhook delivery response."""

    id: uuid.UUID
    payload: dict[str, Any]
    status_code: int | None
    success: bool
    attempt_count: int
    error: str | None
    delivered_at: datetime

    class Config:
        from_attributes = True


class WebhookTestResponse(BaseModel):
    """Webhook test response."""

    success: bool
    status_code: int | None
    response_time_ms: int
    error: str | None


@router.post("", response_model=WebhookResponse)
async def create_webhook(
    request: CreateWebhookRequest,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
) -> Webhook:
    """Create a new webhook subscription."""
    # Validate event type
    if request.event_type not in VALID_EVENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid event type. Must be one of: {', '.join(VALID_EVENT_TYPES)}",
        )

    # Validate chain/network
    if not ChainRegistry.is_supported(request.chain, request.network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {request.chain}/{request.network}",
        )

    # Generate webhook secret for HMAC signing
    webhook_secret = secrets.token_urlsafe(32)

    webhook = Webhook(
        project_id=project.id,
        name=request.name,
        url=str(request.url),
        chain=request.chain,
        network=request.network,
        event_type=request.event_type,
        filters=request.filters,
        secret=webhook_secret,
    )

    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)

    return webhook


@router.get("", response_model=list[WebhookResponse])
async def list_webhooks(
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
    chain: str | None = None,
    event_type: str | None = None,
) -> list[Webhook]:
    """List all webhooks for the project."""
    query = select(Webhook).where(Webhook.project_id == project.id)

    if chain:
        query = query.where(Webhook.chain == chain)
    if event_type:
        query = query.where(Webhook.event_type == event_type)

    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{webhook_id}", response_model=WebhookResponse)
async def get_webhook(
    webhook_id: uuid.UUID,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
) -> Webhook:
    """Get a specific webhook."""
    result = await db.execute(
        select(Webhook).where(
            Webhook.id == webhook_id,
            Webhook.project_id == project.id,
        )
    )
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found",
        )

    return webhook


@router.patch("/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(
    webhook_id: uuid.UUID,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
    name: str | None = None,
    url: HttpUrl | None = None,
    is_active: bool | None = None,
    filters: dict[str, Any] | None = None,
) -> Webhook:
    """Update a webhook."""
    result = await db.execute(
        select(Webhook).where(
            Webhook.id == webhook_id,
            Webhook.project_id == project.id,
        )
    )
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found",
        )

    if name is not None:
        webhook.name = name
    if url is not None:
        webhook.url = str(url)
    if is_active is not None:
        webhook.is_active = is_active
    if filters is not None:
        webhook.filters = filters

    await db.commit()
    await db.refresh(webhook)

    return webhook


@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: uuid.UUID,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
) -> dict:
    """Delete a webhook."""
    result = await db.execute(
        select(Webhook).where(
            Webhook.id == webhook_id,
            Webhook.project_id == project.id,
        )
    )
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found",
        )

    await db.delete(webhook)
    await db.commit()

    return {"status": "deleted", "id": str(webhook_id)}


@router.get("/{webhook_id}/deliveries", response_model=list[WebhookDeliveryResponse])
async def get_webhook_deliveries(
    webhook_id: uuid.UUID,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
    limit: int = 50,
) -> list[WebhookDelivery]:
    """Get recent deliveries for a webhook."""
    # Verify webhook exists and belongs to project
    result = await db.execute(
        select(Webhook).where(
            Webhook.id == webhook_id,
            Webhook.project_id == project.id,
        )
    )
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found",
        )

    # Get recent deliveries
    result = await db.execute(
        select(WebhookDelivery)
        .where(WebhookDelivery.webhook_id == webhook_id)
        .order_by(WebhookDelivery.delivered_at.desc())
        .limit(limit)
    )

    return list(result.scalars().all())


@router.post("/{webhook_id}/test", response_model=WebhookTestResponse)
async def test_webhook(
    webhook_id: uuid.UUID,
    api_key: ApiKeyDep,
    project: ProjectDep,
    db: DbDep,
) -> WebhookTestResponse:
    """Send a test event to a webhook."""
    import httpx
    import time

    result = await db.execute(
        select(Webhook).where(
            Webhook.id == webhook_id,
            Webhook.project_id == project.id,
        )
    )
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found",
        )

    # Create test payload
    test_payload = {
        "id": str(uuid.uuid4()),
        "event": webhook.event_type,
        "chain": webhook.chain,
        "network": webhook.network,
        "data": {
            "test": True,
            "message": "This is a test webhook delivery",
        },
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Sign payload
    signature = hmac.new(
        webhook.secret.encode(),
        str(test_payload).encode(),
        hashlib.sha256,
    ).hexdigest()

    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                webhook.url,
                json=test_payload,
                headers={
                    "Content-Type": "application/json",
                    "X-Bootnode-Signature": signature,
                    "X-Bootnode-Event": webhook.event_type,
                },
            )

        response_time = int((time.time() - start_time) * 1000)

        return WebhookTestResponse(
            success=response.status_code < 400,
            status_code=response.status_code,
            response_time_ms=response_time,
            error=None if response.status_code < 400 else response.text[:500],
        )

    except Exception as e:
        response_time = int((time.time() - start_time) * 1000)
        return WebhookTestResponse(
            success=False,
            status_code=None,
            response_time_ms=response_time,
            error=str(e),
        )
