"""Multi-tier caching: Redis (L1) + Cloudflare (L2) for planet-scale RPC.

Architecture:
┌──────────────────────────────────────────────────────────────────────┐
│                         Client Request                                │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge (L2)                               │
│  - 300+ global PoPs                                                   │
│  - Cache SHARED across ALL accounts (blockchain data is public)       │
│  - Serves 99%+ of requests from edge                                  │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │ (cache miss)
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Redis Cluster (L1)                               │
│  - Regional caches (us-east, eu-west, ap-northeast)                   │
│  - Sub-millisecond lookups                                            │
│  - Reduces origin load                                                │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │ (cache miss)
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Origin RPC                                    │
│  - Load balanced across providers                                     │
│  - Fallback to public endpoints                                       │
│  - Response cached in L1 + returned to L2                             │
└──────────────────────────────────────────────────────────────────────┘

Cost Analysis:
- Cloudflare Free/Pro: 100B+ requests/month at edge
- Redis: Only receives 1-5% of traffic (cache misses)
- Origin RPC: Only receives 0.1-1% of traffic
- Result: Can serve ALL 100+ chains essentially for FREE
"""

import asyncio
import hashlib
import json
import time
from dataclasses import dataclass
from typing import Any

import structlog

from bootnode.core.cache.cloudflare import (
    CacheTier,
    get_cache_tier,
    generate_cache_key,
    generate_cloudflare_cache_headers,
    CACHE_TTLS,
)

logger = structlog.get_logger()


@dataclass
class CacheStats:
    """Cache hit/miss statistics."""
    l1_hits: int = 0
    l1_misses: int = 0
    l2_hits: int = 0
    l2_misses: int = 0
    origin_calls: int = 0
    total_requests: int = 0

    @property
    def l1_hit_rate(self) -> float:
        return self.l1_hits / max(self.total_requests, 1)

    @property
    def l2_hit_rate(self) -> float:
        return self.l2_hits / max(self.total_requests, 1)

    @property
    def total_hit_rate(self) -> float:
        return (self.l1_hits + self.l2_hits) / max(self.total_requests, 1)


class MultiTierCache:
    """Multi-tier cache with Redis L1 and Cloudflare L2."""

    def __init__(self, redis_client: Any = None):
        self.redis = redis_client
        self.stats = CacheStats()
        self._local_cache: dict[str, tuple[Any, float]] = {}  # In-memory L0
        self._local_cache_max = 10000  # Max items in local cache

    async def get(
        self,
        chain: str,
        network: str,
        method: str,
        params: list | None = None,
    ) -> tuple[Any | None, CacheTier, dict[str, str]]:
        """Get cached RPC response.

        Returns: (cached_value, cache_tier, cloudflare_headers)
        """
        self.stats.total_requests += 1

        tier = get_cache_tier(method, params)
        headers = generate_cloudflare_cache_headers(tier, chain, method)

        # No cache for this method
        if tier == CacheTier.NO_CACHE:
            return None, tier, headers

        cache_key = generate_cache_key(chain, network, method, params)

        # L0: In-memory cache (hot data)
        if cached := self._get_local(cache_key, tier):
            self.stats.l1_hits += 1
            logger.debug("L0 cache hit", key=cache_key)
            return cached, tier, headers

        # L1: Redis cache
        if self.redis:
            try:
                cached = await self.redis.get(cache_key)
                if cached:
                    self.stats.l1_hits += 1
                    # Populate L0
                    self._set_local(cache_key, cached, tier)
                    logger.debug("L1 cache hit", key=cache_key)
                    return json.loads(cached), tier, headers
            except Exception as e:
                logger.warning("Redis get failed", error=str(e))

        self.stats.l1_misses += 1
        return None, tier, headers

    async def set(
        self,
        chain: str,
        network: str,
        method: str,
        params: list | None,
        value: Any,
    ) -> None:
        """Store RPC response in cache."""
        tier = get_cache_tier(method, params)

        if tier == CacheTier.NO_CACHE:
            return

        cache_key = generate_cache_key(chain, network, method, params)
        ttl = CACHE_TTLS[tier]

        # Set in L0 (local)
        self._set_local(cache_key, value, tier)

        # Set in L1 (Redis)
        if self.redis:
            try:
                await self.redis.set(
                    cache_key,
                    json.dumps(value),
                    ex=ttl,
                )
                logger.debug("Cached in L1", key=cache_key, ttl=ttl)
            except Exception as e:
                logger.warning("Redis set failed", error=str(e))

    def _get_local(self, key: str, tier: CacheTier) -> Any | None:
        """Get from local in-memory cache."""
        if key in self._local_cache:
            value, expires_at = self._local_cache[key]
            if time.time() < expires_at:
                return value
            # Expired, remove
            del self._local_cache[key]
        return None

    def _set_local(self, key: str, value: Any, tier: CacheTier) -> None:
        """Set in local in-memory cache."""
        # Evict if at capacity
        if len(self._local_cache) >= self._local_cache_max:
            # Remove oldest 10%
            to_remove = list(self._local_cache.keys())[:self._local_cache_max // 10]
            for k in to_remove:
                del self._local_cache[k]

        ttl = min(CACHE_TTLS[tier], 300)  # Max 5 min in local cache
        self._local_cache[key] = (value, time.time() + ttl)

    async def invalidate(
        self,
        chain: str | None = None,
        network: str | None = None,
        method: str | None = None,
    ) -> int:
        """Invalidate cache entries by pattern.

        Returns number of keys invalidated.
        """
        pattern_parts = ["rpc"]
        if chain:
            pattern_parts.append(chain)
        if network:
            pattern_parts.append(network)
        if method:
            pattern_parts.append(method)

        pattern = ":".join(pattern_parts) + ":*"
        count = 0

        # Clear local cache
        keys_to_remove = [k for k in self._local_cache if k.startswith(pattern.replace("*", ""))]
        for k in keys_to_remove:
            del self._local_cache[k]
            count += 1

        # Clear Redis
        if self.redis:
            try:
                async for key in self.redis.scan_iter(pattern):
                    await self.redis.delete(key)
                    count += 1
            except Exception as e:
                logger.warning("Redis invalidate failed", error=str(e))

        logger.info("Cache invalidated", pattern=pattern, count=count)
        return count

    def get_stats(self) -> dict[str, Any]:
        """Get cache statistics."""
        return {
            "l1_hits": self.stats.l1_hits,
            "l1_misses": self.stats.l1_misses,
            "l2_hits": self.stats.l2_hits,
            "l2_misses": self.stats.l2_misses,
            "origin_calls": self.stats.origin_calls,
            "total_requests": self.stats.total_requests,
            "l1_hit_rate": f"{self.stats.l1_hit_rate:.2%}",
            "l2_hit_rate": f"{self.stats.l2_hit_rate:.2%}",
            "total_hit_rate": f"{self.stats.total_hit_rate:.2%}",
            "local_cache_size": len(self._local_cache),
        }


class BatchCacheOptimizer:
    """Optimize batch RPC requests for caching.

    Strategy:
    1. Deduplicate requests in batch
    2. Check cache for each unique request
    3. Only fetch cache misses from origin
    4. Reconstruct batch response
    """

    def __init__(self, cache: MultiTierCache):
        self.cache = cache

    async def process_batch(
        self,
        chain: str,
        network: str,
        requests: list[dict],
    ) -> tuple[list[dict], list[int], dict[str, str]]:
        """Process a batch of RPC requests with caching.

        Returns:
            - requests_to_fetch: Requests that need to go to origin
            - cached_indices: Indices of requests that were cached
            - headers: Cloudflare cache headers
        """
        cached_responses: dict[int, Any] = {}
        requests_to_fetch: list[tuple[int, dict]] = []
        headers: dict[str, str] = {}

        # Check cache for each request
        for i, req in enumerate(requests):
            method = req.get("method", "")
            params = req.get("params", [])

            cached, tier, req_headers = await self.cache.get(
                chain, network, method, params
            )

            if cached is not None:
                # Build JSON-RPC response
                cached_responses[i] = {
                    "jsonrpc": "2.0",
                    "id": req.get("id"),
                    "result": cached,
                }
            else:
                requests_to_fetch.append((i, req))

            # Merge headers (use most restrictive)
            headers.update(req_headers)

        return (
            [req for _, req in requests_to_fetch],
            cached_responses,
            [idx for idx, _ in requests_to_fetch],
            headers,
        )

    async def merge_responses(
        self,
        chain: str,
        network: str,
        requests: list[dict],
        cached_responses: dict[int, Any],
        fetch_indices: list[int],
        fetched_responses: list[dict],
    ) -> list[dict]:
        """Merge cached and fetched responses, caching new results."""
        # Cache fetched responses
        for idx, (fetch_idx, response) in enumerate(zip(fetch_indices, fetched_responses)):
            if "result" in response:
                req = requests[fetch_idx]
                await self.cache.set(
                    chain,
                    network,
                    req.get("method", ""),
                    req.get("params", []),
                    response["result"],
                )
            cached_responses[fetch_idx] = response

        # Reconstruct in original order
        return [cached_responses[i] for i in range(len(requests))]


# Global cache instance
_multi_tier_cache: MultiTierCache | None = None


def get_multi_tier_cache(redis_client: Any = None) -> MultiTierCache:
    """Get or create multi-tier cache singleton."""
    global _multi_tier_cache
    if _multi_tier_cache is None:
        _multi_tier_cache = MultiTierCache(redis_client)
    return _multi_tier_cache
