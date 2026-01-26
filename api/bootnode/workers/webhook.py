"""Webhook delivery worker.

Processes webhook events from Redis queue and delivers them to registered endpoints.
Uses arq (async Redis queue) for job processing - compatible with @hanzo/mq patterns.
"""

import asyncio
import hashlib
import hmac
import json
import sys
import time
from datetime import datetime, timedelta
from typing import Any

import httpx
import structlog
from arq import create_pool, cron
from arq.connections import RedisSettings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from bootnode.config import get_settings
from bootnode.db.session import AsyncSessionLocal
from bootnode.db.models import Webhook, WebhookDelivery
from bootnode.core.datastore import datastore_client

logger = structlog.get_logger()
settings = get_settings()


async def sign_payload(payload: str, secret: str) -> str:
    """Generate HMAC-SHA256 signature for webhook payload."""
    return hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()


async def deliver_webhook(
    ctx: dict,
    webhook_id: str,
    event_type: str,
    payload: dict[str, Any],
) -> bool:
    """Deliver a webhook to its endpoint (arq job function)."""
    async with AsyncSessionLocal() as session:
        # Get webhook
        result = await session.execute(
            select(Webhook).where(Webhook.id == webhook_id)
        )
        webhook = result.scalar_one_or_none()

        if not webhook:
            logger.warning("Webhook not found", webhook_id=webhook_id)
            return False

        if not webhook.is_active:
            logger.info("Webhook is inactive", webhook_id=webhook_id)
            return False

        payload_json = json.dumps(payload, default=str)
        signature = await sign_payload(payload_json, webhook.secret)

        headers = {
            "Content-Type": "application/json",
            "X-Bootnode-Signature": f"sha256={signature}",
            "X-Bootnode-Event": event_type,
            "X-Bootnode-Webhook-ID": str(webhook.id),
            "X-Bootnode-Timestamp": str(int(time.time())),
        }

        delivery = WebhookDelivery(
            webhook_id=webhook.id,
            event_type=event_type,
            payload=payload,
            status="pending",
        )
        session.add(delivery)
        await session.commit()

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    webhook.url,
                    content=payload_json,
                    headers=headers,
                )

            response_time_ms = int((time.time() - start_time) * 1000)
            delivery.status = "success" if response.status_code < 400 else "failed"
            delivery.status_code = response.status_code
            delivery.response_time_ms = response_time_ms
            delivery.delivered_at = datetime.utcnow()

            if response.status_code >= 400:
                delivery.error = f"HTTP {response.status_code}: {response.text[:500]}"
                webhook.failure_count += 1
            else:
                webhook.failure_count = 0

            webhook.last_triggered_at = datetime.utcnow()
            await session.commit()

            # Record to DataStore for analytics
            if datastore_client.is_connected:
                await datastore_client.insert_one(
                    "webhook_deliveries",
                    {
                        "id": str(delivery.id),
                        "webhook_id": str(webhook.id),
                        "project_id": str(webhook.project_id),
                        "chain_id": webhook.chain_id,
                        "network": webhook.network,
                        "event_type": event_type,
                        "payload": payload_json,
                        "status": delivery.status,
                        "status_code": response.status_code,
                        "response_time_ms": response_time_ms,
                        "attempt": 1,
                        "delivered_at": delivery.delivered_at,
                    },
                )

            logger.info(
                "Webhook delivered",
                webhook_id=str(webhook.id),
                status=delivery.status,
                response_time_ms=response_time_ms,
            )
            return delivery.status == "success"

        except Exception as e:
            response_time_ms = int((time.time() - start_time) * 1000)
            delivery.status = "failed"
            delivery.response_time_ms = response_time_ms
            delivery.error = str(e)
            webhook.failure_count += 1
            await session.commit()

            logger.error(
                "Webhook delivery failed",
                webhook_id=str(webhook.id),
                url=webhook.url,
                error=str(e),
            )
            return False


async def process_webhook_event(
    ctx: dict,
    event_type: str,
    chain_id: int,
    network: str,
    payload: dict[str, Any],
    filters: dict[str, Any] | None = None,
) -> int:
    """Process a webhook event and queue deliveries for matching webhooks."""
    filters = filters or {}
    delivered_count = 0

    logger.info(
        "Processing webhook event",
        event_type=event_type,
        chain_id=chain_id,
        network=network,
    )

    async with AsyncSessionLocal() as session:
        query = select(Webhook).where(
            Webhook.chain_id == chain_id,
            Webhook.network == network,
            Webhook.event_type == event_type,
            Webhook.is_active == True,
            Webhook.failure_count < 10,  # Disable after 10 failures
        )
        result = await session.execute(query)
        webhooks = result.scalars().all()

        redis = ctx.get("redis")
        for webhook in webhooks:
            # Check if webhook filters match the event
            if await matches_filters(webhook.filters, filters, payload):
                # Queue the delivery job
                await redis.enqueue_job(
                    "deliver_webhook",
                    str(webhook.id),
                    event_type,
                    payload,
                )
                delivered_count += 1

    return delivered_count


async def matches_filters(
    webhook_filters: dict[str, Any] | None,
    event_filters: dict[str, Any],
    payload: dict[str, Any],
) -> bool:
    """Check if webhook filters match the event."""
    if not webhook_filters:
        return True

    # Address filter
    if "address" in webhook_filters:
        addresses = webhook_filters["address"]
        if isinstance(addresses, str):
            addresses = [addresses]
        addresses = [a.lower() for a in addresses]

        event_addresses = []
        if "from" in payload:
            event_addresses.append(payload["from"].lower())
        if "to" in payload:
            event_addresses.append(payload["to"].lower())
        if "address" in payload:
            event_addresses.append(payload["address"].lower())

        if not any(addr in addresses for addr in event_addresses):
            return False

    # Contract filter
    if "contract" in webhook_filters:
        contracts = webhook_filters["contract"]
        if isinstance(contracts, str):
            contracts = [contracts]
        contracts = [c.lower() for c in contracts]

        if payload.get("contract", "").lower() not in contracts:
            return False

    return True


async def cleanup_old_deliveries(ctx: dict) -> int:
    """Cleanup old webhook deliveries (cron job)."""
    async with AsyncSessionLocal() as session:
        cutoff = datetime.utcnow() - timedelta(days=30)
        # In production, implement proper cleanup
        logger.info("Cleanup job running", cutoff=cutoff)
        return 0


async def startup(ctx: dict) -> None:
    """Worker startup - initialize connections."""
    logger.info("Starting webhook worker")

    # Initialize DataStore
    try:
        await datastore_client.initialize()
        logger.info("DataStore connected")
    except Exception as e:
        logger.warning("DataStore not available", error=str(e))


async def shutdown(ctx: dict) -> None:
    """Worker shutdown - cleanup connections."""
    logger.info("Shutting down webhook worker")
    await datastore_client.close()


class WorkerSettings:
    """arq worker settings."""

    functions = [
        deliver_webhook,
        process_webhook_event,
    ]

    cron_jobs = [
        cron(cleanup_old_deliveries, hour=3, minute=0),  # Run at 3 AM daily
    ]

    on_startup = startup
    on_shutdown = shutdown

    # Redis connection settings
    redis_settings = RedisSettings.from_dsn(settings.redis_url)

    # Worker settings
    max_jobs = 100
    job_timeout = 60
    keep_result = 3600  # Keep results for 1 hour
    queue_name = "bootnode:webhooks"


async def main() -> None:
    """Main entry point for running as script."""
    from arq import run_worker

    # Run the worker
    run_worker(WorkerSettings)


if __name__ == "__main__":
    asyncio.run(main())
