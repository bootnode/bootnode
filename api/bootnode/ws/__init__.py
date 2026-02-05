"""WebSocket API - Real-time blockchain subscriptions."""

import asyncio
import json
from collections import defaultdict
from typing import Any

import structlog
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from bootnode.core.chains import ChainRegistry, RPCClient

router = APIRouter()
logger = structlog.get_logger()


class ConnectionManager:
    """Manage WebSocket connections and subscriptions."""

    def __init__(self) -> None:
        # connection_id -> WebSocket
        self.active_connections: dict[str, WebSocket] = {}
        # connection_id -> list of subscription_ids
        self.subscriptions: dict[str, list[str]] = defaultdict(list)
        # subscription_id -> subscription_info
        self.subscription_info: dict[str, dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, connection_id: str) -> None:
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        logger.info("WebSocket connected", connection_id=connection_id)

    def disconnect(self, connection_id: str) -> None:
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
            # Clean up subscriptions
            for sub_id in self.subscriptions.get(connection_id, []):
                if sub_id in self.subscription_info:
                    del self.subscription_info[sub_id]
            if connection_id in self.subscriptions:
                del self.subscriptions[connection_id]
            logger.info("WebSocket disconnected", connection_id=connection_id)

    async def send_message(self, connection_id: str, message: dict[str, Any]) -> None:
        if connection_id in self.active_connections:
            await self.active_connections[connection_id].send_json(message)

    def add_subscription(
        self,
        connection_id: str,
        subscription_id: str,
        subscription_type: str,
        params: dict[str, Any],
    ) -> None:
        self.subscriptions[connection_id].append(subscription_id)
        self.subscription_info[subscription_id] = {
            "connection_id": connection_id,
            "type": subscription_type,
            "params": params,
        }

    def remove_subscription(self, connection_id: str, subscription_id: str) -> bool:
        if subscription_id in self.subscription_info:
            del self.subscription_info[subscription_id]
            self.subscriptions[connection_id].remove(subscription_id)
            return True
        return False


manager = ConnectionManager()


@router.websocket("/{chain}")
@router.websocket("/{chain}/{network}")
async def websocket_endpoint(
    websocket: WebSocket,
    chain: str,
    network: str = "mainnet",
    api_key: str = Query(default=""),
) -> None:
    """
    WebSocket endpoint for real-time blockchain subscriptions.

    Supports standard Ethereum subscription methods:
    - eth_subscribe: Subscribe to events
    - eth_unsubscribe: Unsubscribe from events

    Subscription types:
    - newHeads: New block headers
    - newPendingTransactions: Pending transactions
    - logs: Contract event logs
    """
    if not ChainRegistry.is_supported(chain, network):
        await websocket.close(code=4000, reason=f"Unsupported chain: {chain}/{network}")
        return

    if not api_key:
        await websocket.close(code=4001, reason="API key required")
        return

    # Generate connection ID
    import uuid
    connection_id = str(uuid.uuid4())

    await manager.connect(websocket, connection_id)

    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            try:
                request = json.loads(data)
            except json.JSONDecodeError:
                await manager.send_message(connection_id, {
                    "jsonrpc": "2.0",
                    "error": {"code": -32700, "message": "Parse error"},
                    "id": None,
                })
                continue

            # Handle request
            response = await handle_ws_request(
                chain, network, request, connection_id
            )
            await manager.send_message(connection_id, response)

    except WebSocketDisconnect:
        manager.disconnect(connection_id)
    except Exception as e:
        logger.error("WebSocket error", error=str(e), connection_id=connection_id)
        manager.disconnect(connection_id)


async def handle_ws_request(
    chain: str,
    network: str,
    request: dict[str, Any],
    connection_id: str,
) -> dict[str, Any]:
    """Handle a WebSocket JSON-RPC request."""
    method = request.get("method", "")
    params = request.get("params", [])
    request_id = request.get("id")

    if method == "eth_subscribe":
        return await handle_subscribe(chain, network, params, request_id, connection_id)
    elif method == "eth_unsubscribe":
        return await handle_unsubscribe(params, request_id, connection_id)
    else:
        # Forward other methods to RPC
        try:
            async with RPCClient(chain, network) as client:
                result = await client.call(method, params, request_id or 1)
                return {
                    "jsonrpc": "2.0",
                    "result": result,
                    "id": request_id,
                }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "error": {"code": -32603, "message": str(e)},
                "id": request_id,
            }


async def handle_subscribe(
    chain: str,
    network: str,
    params: list[Any],
    request_id: Any,
    connection_id: str,
) -> dict[str, Any]:
    """Handle eth_subscribe."""
    if not params:
        return {
            "jsonrpc": "2.0",
            "error": {"code": -32602, "message": "Missing subscription type"},
            "id": request_id,
        }

    sub_type = params[0]
    sub_params = params[1] if len(params) > 1 else {}

    # Generate subscription ID
    import secrets
    subscription_id = "0x" + secrets.token_hex(16)

    # Register subscription
    manager.add_subscription(
        connection_id,
        subscription_id,
        sub_type,
        {"chain": chain, "network": network, **sub_params},
    )

    # Start subscription task
    if sub_type == "newHeads":
        asyncio.create_task(
            poll_new_heads(chain, network, connection_id, subscription_id)
        )
    elif sub_type == "newPendingTransactions":
        asyncio.create_task(
            poll_pending_transactions(chain, network, connection_id, subscription_id)
        )
    elif sub_type == "logs":
        asyncio.create_task(
            poll_logs(chain, network, connection_id, subscription_id, sub_params)
        )
    else:
        return {
            "jsonrpc": "2.0",
            "error": {"code": -32602, "message": f"Unknown subscription type: {sub_type}"},
            "id": request_id,
        }

    return {
        "jsonrpc": "2.0",
        "result": subscription_id,
        "id": request_id,
    }


async def handle_unsubscribe(
    params: list[Any],
    request_id: Any,
    connection_id: str,
) -> dict[str, Any]:
    """Handle eth_unsubscribe."""
    if not params:
        return {
            "jsonrpc": "2.0",
            "error": {"code": -32602, "message": "Missing subscription ID"},
            "id": request_id,
        }

    subscription_id = params[0]
    success = manager.remove_subscription(connection_id, subscription_id)

    return {
        "jsonrpc": "2.0",
        "result": success,
        "id": request_id,
    }


async def poll_new_heads(
    chain: str,
    network: str,
    connection_id: str,
    subscription_id: str,
) -> None:
    """Poll for new block headers."""
    last_block = 0

    while subscription_id in manager.subscription_info:
        try:
            async with RPCClient(chain, network) as client:
                current_block = await client.get_block_number()

                if current_block > last_block:
                    # Get the new block
                    block = await client.call(
                        "eth_getBlockByNumber",
                        [hex(current_block), False],
                    )

                    if block:
                        await manager.send_message(connection_id, {
                            "jsonrpc": "2.0",
                            "method": "eth_subscription",
                            "params": {
                                "subscription": subscription_id,
                                "result": block,
                            },
                        })

                    last_block = current_block

            await asyncio.sleep(1)  # Poll every second

        except Exception as e:
            logger.error("newHeads poll error", error=str(e))
            await asyncio.sleep(5)


async def poll_pending_transactions(
    chain: str,
    network: str,
    connection_id: str,
    subscription_id: str,
) -> None:
    """Poll for pending transactions (simplified - uses filter)."""
    filter_id = None

    try:
        async with RPCClient(chain, network) as client:
            # Create pending transaction filter
            filter_id = await client.call("eth_newPendingTransactionFilter", [])

            while subscription_id in manager.subscription_info:
                try:
                    # Get filter changes
                    tx_hashes = await client.call("eth_getFilterChanges", [filter_id])

                    for tx_hash in tx_hashes or []:
                        await manager.send_message(connection_id, {
                            "jsonrpc": "2.0",
                            "method": "eth_subscription",
                            "params": {
                                "subscription": subscription_id,
                                "result": tx_hash,
                            },
                        })

                    await asyncio.sleep(1)

                except Exception as e:
                    logger.error("pendingTx poll error", error=str(e))
                    await asyncio.sleep(5)

    except Exception as e:
        logger.error("pendingTx filter error", error=str(e))


async def poll_logs(
    chain: str,
    network: str,
    connection_id: str,
    subscription_id: str,
    params: dict[str, Any],
) -> None:
    """Poll for logs matching filter."""
    last_block = 0

    while subscription_id in manager.subscription_info:
        try:
            async with RPCClient(chain, network) as client:
                current_block = await client.get_block_number()

                if current_block > last_block:
                    # Get logs for new blocks
                    logs = await client.get_logs(
                        from_block=last_block + 1 if last_block else current_block,
                        to_block=current_block,
                        address=params.get("address"),
                        topics=params.get("topics"),
                    )

                    for log in logs or []:
                        await manager.send_message(connection_id, {
                            "jsonrpc": "2.0",
                            "method": "eth_subscription",
                            "params": {
                                "subscription": subscription_id,
                                "result": log,
                            },
                        })

                    last_block = current_block

            await asyncio.sleep(2)  # Poll every 2 seconds

        except Exception as e:
            logger.error("logs poll error", error=str(e))
            await asyncio.sleep(5)