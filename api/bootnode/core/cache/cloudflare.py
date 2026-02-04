"""Cloudflare edge caching for planet-scale RPC infrastructure.

STRATEGY: Blockchain data is PUBLIC and IDENTICAL for ALL users.
Cache aggressively at Cloudflare edge to serve 100+ chains at near-$0 cost.

Cache Tiers:
1. IMMUTABLE (forever): Finalized blocks, transactions, receipts by hash
2. LONG (1 hour): Block by number (if finalized), logs by block hash
3. MEDIUM (30 seconds): Latest block number, gas prices
4. SHORT (5 seconds): Pending transactions, mempool
5. NO CACHE: State calls (eth_call), balances at "latest", send transactions

Key insight: Cache keys do NOT include API key/account - shared across ALL users.
"""

from enum import Enum
from typing import Any
import hashlib
import json


class CacheTier(str, Enum):
    """Cache duration tiers."""
    IMMUTABLE = "immutable"  # 1 year (effectively forever)
    LONG = "long"            # 1 hour
    MEDIUM = "medium"        # 30 seconds
    SHORT = "short"          # 5 seconds
    REALTIME = "realtime"    # 2 seconds
    NO_CACHE = "no_cache"    # Never cache


# Cache TTLs in seconds
CACHE_TTLS = {
    CacheTier.IMMUTABLE: 31536000,  # 1 year
    CacheTier.LONG: 3600,           # 1 hour
    CacheTier.MEDIUM: 30,           # 30 seconds
    CacheTier.SHORT: 5,             # 5 seconds
    CacheTier.REALTIME: 2,          # 2 seconds
    CacheTier.NO_CACHE: 0,          # No cache
}


# RPC method -> cache tier mapping
# Principle: If the data is immutable (by hash) -> IMMUTABLE
#            If the data changes rarely -> LONG
#            If the data changes with blocks -> MEDIUM
#            If the data changes frequently -> SHORT
#            If the data is state-dependent or write -> NO_CACHE
METHOD_CACHE_TIERS: dict[str, CacheTier] = {
    # === IMMUTABLE: Data by hash never changes ===
    "eth_getBlockByHash": CacheTier.IMMUTABLE,
    "eth_getTransactionByHash": CacheTier.IMMUTABLE,
    "eth_getTransactionReceipt": CacheTier.IMMUTABLE,
    "eth_getUncleByBlockHashAndIndex": CacheTier.IMMUTABLE,
    "eth_getBlockTransactionCountByHash": CacheTier.IMMUTABLE,
    "eth_getUncleCountByBlockHash": CacheTier.IMMUTABLE,
    "eth_getTransactionByBlockHashAndIndex": CacheTier.IMMUTABLE,
    # Code at address is immutable (contracts can't change bytecode)
    "eth_getCode": CacheTier.IMMUTABLE,

    # === LONG: Static chain info or finalized block data ===
    "eth_chainId": CacheTier.IMMUTABLE,
    "net_version": CacheTier.IMMUTABLE,
    "web3_clientVersion": CacheTier.LONG,
    "eth_protocolVersion": CacheTier.LONG,
    "eth_syncing": CacheTier.MEDIUM,
    # Block by number (for finalized blocks - we check finality)
    "eth_getBlockByNumber": CacheTier.LONG,
    "eth_getBlockTransactionCountByNumber": CacheTier.LONG,
    "eth_getUncleCountByBlockNumber": CacheTier.LONG,
    "eth_getTransactionByBlockNumberAndIndex": CacheTier.LONG,
    "eth_getUncleByBlockNumberAndIndex": CacheTier.LONG,
    # Logs by block hash (immutable) - we'll check in handler
    "eth_getLogs": CacheTier.MEDIUM,

    # === MEDIUM: Changes with each block ===
    "eth_blockNumber": CacheTier.REALTIME,
    "eth_gasPrice": CacheTier.MEDIUM,
    "eth_maxPriorityFeePerGas": CacheTier.MEDIUM,
    "eth_feeHistory": CacheTier.MEDIUM,
    "eth_getStorageAt": CacheTier.MEDIUM,

    # === SHORT: Changes frequently ===
    "eth_accounts": CacheTier.SHORT,
    "eth_hashrate": CacheTier.SHORT,
    "eth_mining": CacheTier.SHORT,

    # === NO CACHE: State-dependent or write operations ===
    "eth_getBalance": CacheTier.NO_CACHE,  # Balance changes with txs
    "eth_getTransactionCount": CacheTier.NO_CACHE,  # Nonce changes
    "eth_call": CacheTier.NO_CACHE,  # State-dependent
    "eth_estimateGas": CacheTier.NO_CACHE,  # State-dependent
    "eth_sendRawTransaction": CacheTier.NO_CACHE,  # Write
    "eth_sendTransaction": CacheTier.NO_CACHE,  # Write
    "eth_sign": CacheTier.NO_CACHE,  # User-specific
    "eth_signTransaction": CacheTier.NO_CACHE,  # User-specific
    "personal_sign": CacheTier.NO_CACHE,  # User-specific
    "eth_getFilterChanges": CacheTier.NO_CACHE,  # Stateful
    "eth_getFilterLogs": CacheTier.NO_CACHE,  # Stateful
    "eth_newFilter": CacheTier.NO_CACHE,  # Stateful
    "eth_newBlockFilter": CacheTier.NO_CACHE,  # Stateful
    "eth_newPendingTransactionFilter": CacheTier.NO_CACHE,  # Stateful
    "eth_uninstallFilter": CacheTier.NO_CACHE,  # Stateful
    "eth_subscribe": CacheTier.NO_CACHE,  # WebSocket
    "eth_unsubscribe": CacheTier.NO_CACHE,  # WebSocket

    # === Debug/Trace - LONG cache (expensive, deterministic) ===
    "debug_traceTransaction": CacheTier.IMMUTABLE,  # By hash, immutable
    "debug_traceBlockByHash": CacheTier.IMMUTABLE,
    "debug_traceBlockByNumber": CacheTier.LONG,
    "trace_transaction": CacheTier.IMMUTABLE,
    "trace_block": CacheTier.LONG,
    "trace_replayTransaction": CacheTier.IMMUTABLE,
    "trace_replayBlockTransactions": CacheTier.LONG,

    # === ERC-4337 Bundler ===
    "eth_sendUserOperation": CacheTier.NO_CACHE,  # Write
    "eth_estimateUserOperationGas": CacheTier.NO_CACHE,  # State-dependent
    "eth_getUserOperationByHash": CacheTier.IMMUTABLE,  # By hash
    "eth_getUserOperationReceipt": CacheTier.IMMUTABLE,  # By hash
    "eth_supportedEntryPoints": CacheTier.LONG,
}


def get_cache_tier(method: str, params: list | None = None) -> CacheTier:
    """Determine cache tier for an RPC method + params."""
    tier = METHOD_CACHE_TIERS.get(method, CacheTier.SHORT)

    # Special handling for block-number-based queries
    if params and tier in (CacheTier.LONG, CacheTier.MEDIUM):
        # Check if querying "latest", "pending", or "safe"
        block_param = _extract_block_param(method, params)
        if block_param in ("latest", "pending", "safe", "finalized"):
            # These change, use shorter cache
            return CacheTier.REALTIME if block_param == "pending" else CacheTier.MEDIUM

    return tier


def _extract_block_param(method: str, params: list) -> str | None:
    """Extract block number/tag from params based on method."""
    if not params:
        return None

    # Methods where first param is block identifier
    if method in ("eth_getBlockByNumber", "eth_getBlockByHash"):
        return str(params[0]) if params else None

    # Methods where second param is block identifier
    if method in (
        "eth_getBalance",
        "eth_getCode",
        "eth_getTransactionCount",
        "eth_getStorageAt",
        "eth_call",
    ):
        return str(params[1]) if len(params) > 1 else "latest"

    # eth_getLogs uses fromBlock/toBlock in filter object
    if method == "eth_getLogs" and isinstance(params[0], dict):
        filter_obj = params[0]
        if filter_obj.get("blockHash"):
            return "hash"  # By hash, immutable
        return filter_obj.get("toBlock", "latest")

    return None


def generate_cache_key(
    chain: str,
    network: str,
    method: str,
    params: list | None = None,
) -> str:
    """Generate a cache key for an RPC request.

    IMPORTANT: No API key or account in the key!
    Blockchain data is public - same for everyone.
    """
    # Normalize params for consistent hashing
    params_str = json.dumps(params or [], sort_keys=True, separators=(",", ":"))
    params_hash = hashlib.sha256(params_str.encode()).hexdigest()[:16]

    # Format: rpc:{chain}:{network}:{method}:{params_hash}
    return f"rpc:{chain}:{network}:{method}:{params_hash}"


def generate_cloudflare_cache_headers(
    tier: CacheTier,
    chain: str,
    method: str,
) -> dict[str, str]:
    """Generate HTTP headers for Cloudflare caching.

    Uses:
    - Cache-Control for TTL
    - CDN-Cache-Control for Cloudflare-specific behavior
    - Cache-Tag for targeted purging
    - Vary header to ensure proper cache keying
    """
    ttl = CACHE_TTLS[tier]

    if tier == CacheTier.NO_CACHE:
        return {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "CDN-Cache-Control": "no-store",
            "Pragma": "no-cache",
        }

    headers = {
        # Browser cache (shorter) + CDN cache (longer)
        "Cache-Control": f"public, max-age={min(ttl, 60)}, s-maxage={ttl}",
        # Cloudflare-specific: cache for full TTL
        "CDN-Cache-Control": f"max-age={ttl}",
        # Cache tags for targeted purging
        "Cache-Tag": f"rpc,chain-{chain},method-{method},tier-{tier.value}",
        # Stale-while-revalidate for better UX
        "Surrogate-Control": f"max-age={ttl}, stale-while-revalidate={ttl // 2}",
    }

    if tier == CacheTier.IMMUTABLE:
        headers["Cache-Control"] = f"public, max-age={ttl}, immutable"
        headers["CDN-Cache-Control"] = f"max-age={ttl}, immutable"

    return headers


class CloudflareCacheConfig:
    """Cloudflare cache configuration for workers/pages."""

    # Cloudflare zones/domains
    ZONE_ID_ENV = "CLOUDFLARE_ZONE_ID"
    API_TOKEN_ENV = "CLOUDFLARE_API_TOKEN"

    # Cache settings
    CACHE_EVERYTHING = True
    EDGE_TTL_DEFAULT = 3600  # 1 hour default edge TTL
    BROWSER_TTL_DEFAULT = 60  # 1 minute browser TTL

    # Cache bypass conditions
    BYPASS_METHODS = {
        "eth_sendRawTransaction",
        "eth_sendTransaction",
        "eth_sign",
        "eth_signTransaction",
        "personal_sign",
        "eth_subscribe",
        "eth_unsubscribe",
    }

    @classmethod
    def get_page_rule_config(cls) -> dict:
        """Get Cloudflare page rule configuration for RPC endpoints."""
        return {
            "targets": [
                {"target": "url", "constraint": {"operator": "matches", "value": "*rpc.hanzo.ai/*"}}
            ],
            "actions": [
                {"id": "cache_level", "value": "cache_everything"},
                {"id": "edge_cache_ttl", "value": cls.EDGE_TTL_DEFAULT},
                {"id": "browser_cache_ttl", "value": cls.BROWSER_TTL_DEFAULT},
                {"id": "cache_deception_armor", "value": "on"},
                {"id": "origin_cache_control", "value": "on"},
            ],
        }

    @classmethod
    def get_cache_rules(cls) -> list[dict]:
        """Get Cloudflare cache rules for fine-grained control."""
        return [
            # Rule 1: Immutable data (by hash) - cache forever
            {
                "name": "RPC Immutable Data",
                "expression": '(http.request.uri.path contains "/rpc/") and (http.request.body contains "ByHash")',
                "action": "cache",
                "action_parameters": {
                    "edge_ttl": {"mode": "override", "default": 31536000},
                    "browser_ttl": {"mode": "override", "default": 86400},
                    "cache_key": {
                        "custom_key": {
                            "query_string": {"include": "*"},
                            "header": {"include": ["Content-Type"]},
                            "host": {"resolved": True},
                        }
                    },
                },
            },
            # Rule 2: Chain metadata - cache 1 day
            {
                "name": "RPC Chain Metadata",
                "expression": '(http.request.uri.path contains "/rpc/") and (http.request.body contains "eth_chainId" or http.request.body contains "net_version")',
                "action": "cache",
                "action_parameters": {
                    "edge_ttl": {"mode": "override", "default": 86400},
                    "browser_ttl": {"mode": "override", "default": 3600},
                },
            },
            # Rule 3: Write operations - bypass cache
            {
                "name": "RPC Write Operations",
                "expression": '(http.request.uri.path contains "/rpc/") and (http.request.body contains "sendRawTransaction" or http.request.body contains "sendTransaction")',
                "action": "bypass",
            },
        ]


# Cloudflare Worker script for edge caching
CLOUDFLARE_WORKER_SCRIPT = '''
// Cloudflare Worker for aggressive RPC caching
// Shares cache across ALL accounts - blockchain data is public!

const CACHE_TIERS = {
  immutable: 31536000,  // 1 year
  long: 3600,           // 1 hour
  medium: 30,           // 30 seconds
  short: 5,             // 5 seconds
  realtime: 2,          // 2 seconds
};

const IMMUTABLE_METHODS = new Set([
  'eth_getBlockByHash',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_getCode',
  'eth_chainId',
  'net_version',
  'debug_traceTransaction',
  'trace_transaction',
]);

const NO_CACHE_METHODS = new Set([
  'eth_sendRawTransaction',
  'eth_sendTransaction',
  'eth_call',
  'eth_estimateGas',
  'eth_getBalance',
  'eth_getTransactionCount',
  'eth_sign',
  'eth_subscribe',
]);

async function handleRequest(request) {
  // Only cache POST requests to RPC endpoints
  if (request.method !== 'POST') {
    return fetch(request);
  }

  const url = new URL(request.url);
  if (!url.pathname.includes('/rpc/')) {
    return fetch(request);
  }

  // Parse RPC request
  const body = await request.clone().json();
  const method = body.method;
  const params = body.params || [];

  // Check if cacheable
  if (NO_CACHE_METHODS.has(method)) {
    return fetch(request);
  }

  // Generate cache key (no API key - shared across all accounts!)
  const paramsHash = await hashParams(params);
  const pathParts = url.pathname.split('/');
  const chain = pathParts[pathParts.indexOf('rpc') + 1];
  const network = pathParts[pathParts.indexOf('rpc') + 2] || 'mainnet';
  const cacheKey = `rpc:${chain}:${network}:${method}:${paramsHash}`;

  // Check cache
  const cache = caches.default;
  const cacheRequest = new Request(url.origin + '/__cache/' + cacheKey, {
    method: 'GET',
  });

  let response = await cache.match(cacheRequest);
  if (response) {
    // Cache hit! Add header to indicate
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-Cache', 'HIT');
    newResponse.headers.set('X-Cache-Key', cacheKey);
    return newResponse;
  }

  // Cache miss - fetch from origin
  response = await fetch(request);

  if (response.ok) {
    // Determine TTL
    const tier = IMMUTABLE_METHODS.has(method) ? 'immutable' :
                 method.includes('Block') ? 'long' : 'medium';
    const ttl = CACHE_TIERS[tier];

    // Clone and cache
    const responseToCache = new Response(response.clone().body, response);
    responseToCache.headers.set('Cache-Control', `public, max-age=${ttl}`);
    responseToCache.headers.set('X-Cache', 'MISS');
    responseToCache.headers.set('X-Cache-Key', cacheKey);
    responseToCache.headers.set('X-Cache-TTL', ttl.toString());

    // Store in cache (async, don't wait)
    const cacheResponse = new Response(responseToCache.clone().body, {
      headers: {
        'Cache-Control': `public, max-age=${ttl}`,
        'Content-Type': 'application/json',
      },
    });
    event.waitUntil(cache.put(cacheRequest, cacheResponse));

    return responseToCache;
  }

  return response;
}

async function hashParams(params) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(params));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
'''


def get_worker_script() -> str:
    """Get Cloudflare Worker script for deployment."""
    return CLOUDFLARE_WORKER_SCRIPT
