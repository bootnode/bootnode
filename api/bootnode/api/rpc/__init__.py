"""RPC API - JSON-RPC proxy."""

import hashlib
import json
import time
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from bootnode.api.deps import ApiKeyDep, DbDep
from bootnode.core.cache import redis_client
from bootnode.core.chains import ChainRegistry, RPCClient
from bootnode.core.chains.rpc import RPCError, get_compute_units
from bootnode.db.models import Usage

router = APIRouter()


class JsonRpcRequest(BaseModel):
    """JSON-RPC 2.0 request."""

    jsonrpc: str = "2.0"
    method: str
    params: list[Any] | dict[str, Any] | None = None
    id: int | str | None = 1


class JsonRpcResponse(BaseModel):
    """JSON-RPC 2.0 response."""

    jsonrpc: str = "2.0"
    result: Any | None = None
    error: dict[str, Any] | None = None
    id: int | str | None = None


class JsonRpcBatchResponse(BaseModel):
    """Batch JSON-RPC response."""

    responses: list[JsonRpcResponse]


# Cache TTLs by method (in seconds)
CACHE_TTLS: dict[str, int] = {
    "eth_chainId": 86400,  # 1 day
    "net_version": 86400,
    "web3_clientVersion": 3600,
    "eth_blockNumber": 2,  # ~1 block
    "eth_gasPrice": 5,
    "eth_maxPriorityFeePerGas": 5,
    "eth_getBlockByNumber": 60,  # Finalized blocks don't change
    "eth_getBlockByHash": 3600,
    "eth_getTransactionByHash": 3600,
    "eth_getTransactionReceipt": 3600,
}

# Methods that should not be cached
NO_CACHE_METHODS = {
    "eth_sendRawTransaction",
    "eth_sendTransaction",
    "eth_call",  # Can have state-dependent results
    "eth_estimateGas",
    "eth_getBalance",  # Real-time balance needed
    "eth_getTransactionCount",  # Nonce matters
}


def get_params_hash(params: list[Any] | dict[str, Any] | None) -> str:
    """Get a hash of the params for caching."""
    if not params:
        return "none"
    return hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()[:16]


@router.post("/{chain}")
@router.post("/{chain}/{network}")
async def rpc_call(
    chain: str,
    request: JsonRpcRequest | list[JsonRpcRequest],
    api_key: ApiKeyDep,
    db: DbDep,
    network: str = "mainnet",
) -> JsonRpcResponse | list[JsonRpcResponse]:
    """
    Make a JSON-RPC call to a blockchain.

    Supports both single requests and batch requests.
    """
    # Validate chain/network
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    # Check if chain is allowed for this API key
    if api_key.allowed_chains and chain not in api_key.allowed_chains:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Chain '{chain}' not allowed for this API key",
        )

    # Handle batch requests
    if isinstance(request, list):
        return await _handle_batch(chain, network, request, api_key, db)

    return await _handle_single(chain, network, request, api_key, db)


async def _handle_single(
    chain: str,
    network: str,
    request: JsonRpcRequest,
    api_key: ApiKeyDep,
    db: DbDep,
) -> JsonRpcResponse:
    """Handle a single RPC request."""
    method = request.method
    params = request.params if request.params else []
    params_list = params if isinstance(params, list) else [params]

    start_time = time.time()
    compute_units = get_compute_units(method)

    # Check cache first (for cacheable methods)
    cache_key = None
    if method not in NO_CACHE_METHODS:
        params_hash = get_params_hash(params)
        cached = await redis_client.get_rpc_response(chain, network, method, params_hash)
        if cached is not None:
            # Record usage (even cached)
            response_time = int((time.time() - start_time) * 1000)
            await _record_usage(db, api_key, chain, network, method, compute_units, response_time)
            return JsonRpcResponse(
                jsonrpc="2.0",
                result=cached,
                id=request.id,
            )
        cache_key = params_hash

    # Make the RPC call
    try:
        async with RPCClient(chain, network) as client:
            result = await client.call(method, params_list, request.id or 1)

        # Cache the result if applicable
        if cache_key and method in CACHE_TTLS:
            ttl = CACHE_TTLS[method]
            await redis_client.set_rpc_response(chain, network, method, cache_key, result, ttl)

        # Record usage
        response_time = int((time.time() - start_time) * 1000)
        await _record_usage(db, api_key, chain, network, method, compute_units, response_time)

        return JsonRpcResponse(
            jsonrpc="2.0",
            result=result,
            id=request.id,
        )

    except RPCError as e:
        response_time = int((time.time() - start_time) * 1000)
        await _record_usage(db, api_key, chain, network, method, compute_units, response_time, 500)

        return JsonRpcResponse(
            jsonrpc="2.0",
            error={
                "code": e.code,
                "message": e.message,
                "data": e.data,
            },
            id=request.id,
        )

    except Exception as e:
        response_time = int((time.time() - start_time) * 1000)
        await _record_usage(db, api_key, chain, network, method, compute_units, response_time, 500)

        return JsonRpcResponse(
            jsonrpc="2.0",
            error={
                "code": -32603,
                "message": f"Internal error: {str(e)}",
            },
            id=request.id,
        )


async def _handle_batch(
    chain: str,
    network: str,
    requests: list[JsonRpcRequest],
    api_key: ApiKeyDep,
    db: DbDep,
) -> list[JsonRpcResponse]:
    """Handle a batch of RPC requests."""
    # Limit batch size
    if len(requests) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch size cannot exceed 100 requests",
        )

    responses = []
    for req in requests:
        response = await _handle_single(chain, network, req, api_key, db)
        responses.append(response)

    return responses


async def _record_usage(
    db: DbDep,
    api_key: ApiKeyDep,
    chain: str,
    network: str,
    method: str,
    compute_units: int,
    response_time: int,
    status_code: int = 200,
) -> None:
    """Record API usage."""
    usage = Usage(
        project_id=api_key.project_id,
        api_key_id=api_key.id,
        chain=chain,
        network=network,
        method=method,
        compute_units=compute_units,
        response_time_ms=response_time,
        status_code=status_code,
    )
    db.add(usage)
    # Don't await commit here - let the session handle it
