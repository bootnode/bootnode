"""Redis cache client."""

import json
from typing import Any

import redis.asyncio as redis
import structlog

from bootnode.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class RedisClient:
    """Async Redis client wrapper."""

    def __init__(self) -> None:
        self._client: redis.Redis | None = None

    async def initialize(self) -> None:
        """Initialize Redis connection."""
        self._client = redis.from_url(
            str(settings.redis_url),
            encoding="utf-8",
            decode_responses=True,
        )
        logger.info("Redis connected", url=str(settings.redis_url).split("@")[-1])

    async def close(self) -> None:
        """Close Redis connection."""
        if self._client:
            await self._client.aclose()
            logger.info("Redis connection closed")

    @property
    def client(self) -> redis.Redis:
        if not self._client:
            raise RuntimeError("Redis not initialized")
        return self._client

    # Key-Value Operations
    async def get(self, key: str) -> str | None:
        """Get a value by key."""
        return await self.client.get(key)

    async def set(
        self,
        key: str,
        value: str,
        ex: int | None = None,
        px: int | None = None,
    ) -> bool:
        """Set a value with optional expiration."""
        return await self.client.set(key, value, ex=ex, px=px) or False

    async def delete(self, *keys: str) -> int:
        """Delete one or more keys."""
        return await self.client.delete(*keys)

    async def exists(self, *keys: str) -> int:
        """Check if keys exist."""
        return await self.client.exists(*keys)

    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on a key."""
        return await self.client.expire(key, seconds)

    async def ttl(self, key: str) -> int:
        """Get TTL of a key."""
        return await self.client.ttl(key)

    # JSON Operations
    async def get_json(self, key: str) -> Any:
        """Get and deserialize JSON value."""
        value = await self.get(key)
        if value:
            return json.loads(value)
        return None

    async def set_json(
        self,
        key: str,
        value: Any,
        ex: int | None = None,
    ) -> bool:
        """Serialize and set JSON value."""
        return await self.set(key, json.dumps(value), ex=ex)

    # Rate Limiting
    async def rate_limit_check(
        self,
        key: str,
        limit: int,
        window_seconds: int = 60,
    ) -> tuple[bool, int]:
        """
        Check rate limit using sliding window.
        Returns (allowed, remaining).
        """
        pipe = self.client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        results = await pipe.execute()

        current = results[0]
        remaining = max(0, limit - current)
        allowed = current <= limit

        return allowed, remaining

    async def rate_limit_get(self, key: str, limit: int) -> tuple[int, int]:
        """Get current rate limit status. Returns (current, remaining)."""
        current = await self.get(key)
        current_int = int(current) if current else 0
        remaining = max(0, limit - current_int)
        return current_int, remaining

    # RPC Response Caching
    def rpc_cache_key(
        self,
        chain: str,
        network: str,
        method: str,
        params_hash: str,
    ) -> str:
        """Generate cache key for RPC response."""
        return f"rpc:{chain}:{network}:{method}:{params_hash}"

    async def get_rpc_response(
        self,
        chain: str,
        network: str,
        method: str,
        params_hash: str,
    ) -> Any:
        """Get cached RPC response."""
        key = self.rpc_cache_key(chain, network, method, params_hash)
        return await self.get_json(key)

    async def set_rpc_response(
        self,
        chain: str,
        network: str,
        method: str,
        params_hash: str,
        response: Any,
        ttl: int = 12,  # ~1 block on most chains
    ) -> None:
        """Cache RPC response."""
        key = self.rpc_cache_key(chain, network, method, params_hash)
        await self.set_json(key, response, ex=ttl)

    # Pub/Sub for Webhooks
    async def publish(self, channel: str, message: str) -> int:
        """Publish message to channel."""
        return await self.client.publish(channel, message)

    async def subscribe(self, *channels: str) -> redis.client.PubSub:
        """Subscribe to channels."""
        pubsub = self.client.pubsub()
        await pubsub.subscribe(*channels)
        return pubsub


# Global singleton
redis_client = RedisClient()
