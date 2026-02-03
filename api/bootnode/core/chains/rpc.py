"""RPC client for blockchain interactions."""

from typing import Any

import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from bootnode.core.chains.registry import ChainRegistry, ChainType

logger = structlog.get_logger()


# Compute unit costs for different methods
COMPUTE_UNITS: dict[str, int] = {
    # Free tier (1 CU)
    "eth_chainId": 1,
    "eth_blockNumber": 1,
    "eth_syncing": 1,
    "eth_gasPrice": 1,
    "eth_maxPriorityFeePerGas": 1,
    "net_version": 1,
    "net_listening": 1,
    "web3_clientVersion": 1,
    # Light (5 CU)
    "eth_getBalance": 5,
    "eth_getCode": 5,
    "eth_getStorageAt": 5,
    "eth_getTransactionCount": 5,
    "eth_getBlockByNumber": 5,
    "eth_getBlockByHash": 5,
    "eth_getTransactionByHash": 5,
    "eth_getTransactionReceipt": 5,
    # Medium (10 CU)
    "eth_call": 10,
    "eth_estimateGas": 10,
    "eth_feeHistory": 10,
    "eth_getBlockReceipts": 10,
    # Heavy (25 CU)
    "eth_getLogs": 25,
    "eth_newFilter": 25,
    "eth_newBlockFilter": 25,
    "eth_newPendingTransactionFilter": 25,
    "eth_getFilterChanges": 25,
    "eth_getFilterLogs": 25,
    # Transaction (50 CU)
    "eth_sendRawTransaction": 50,
    # Debug/Trace (100+ CU)
    "debug_traceTransaction": 100,
    "debug_traceBlockByNumber": 150,
    "debug_traceBlockByHash": 150,
    "trace_block": 100,
    "trace_transaction": 100,
    "trace_call": 100,
    # ERC-4337 Bundler (variable)
    "eth_sendUserOperation": 75,
    "eth_estimateUserOperationGas": 25,
    "eth_getUserOperationByHash": 10,
    "eth_getUserOperationReceipt": 10,
    "eth_supportedEntryPoints": 1,
}


def get_compute_units(method: str) -> int:
    """Get compute units for a method."""
    return COMPUTE_UNITS.get(method, 10)  # Default to 10 CU


class RPCError(Exception):
    """RPC error."""

    def __init__(self, code: int, message: str, data: Any = None):
        self.code = code
        self.message = message
        self.data = data
        super().__init__(f"RPC Error {code}: {message}")


class RPCClient:
    """JSON-RPC client for blockchain interactions."""

    def __init__(self, chain: str, network: str = "mainnet"):
        self.chain_slug = chain
        self.network = network
        self._client: httpx.AsyncClient | None = None

        chain_config = ChainRegistry.get_chain(chain)
        if not chain_config:
            raise ValueError(f"Unsupported chain: {chain}")

        self.chain = chain_config
        self.rpc_url = chain_config.get_rpc_url(network)
        if not self.rpc_url:
            raise ValueError(f"No RPC URL configured for {chain}/{network}")

        self.is_evm = chain_config.chain_type == ChainType.EVM

    async def __aenter__(self) -> "RPCClient":
        self._client = httpx.AsyncClient(timeout=30.0)
        return self

    async def __aexit__(self, *args: Any) -> None:
        if self._client:
            await self._client.aclose()

    @property
    def client(self) -> httpx.AsyncClient:
        if not self._client:
            raise RuntimeError("Client not initialized. Use async context manager.")
        return self._client

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=5),
    )
    async def call(
        self,
        method: str,
        params: list[Any] | None = None,
        request_id: int | str = 1,
    ) -> Any:
        """Make a JSON-RPC call."""
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or [],
            "id": request_id,
        }

        logger.debug("RPC call", chain=self.chain_slug, network=self.network, method=method)

        response = await self.client.post(
            self.rpc_url,
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()

        data = response.json()

        if "error" in data:
            error = data["error"]
            raise RPCError(
                code=error.get("code", -32000),
                message=error.get("message", "Unknown error"),
                data=error.get("data"),
            )

        return data.get("result")

    async def batch_call(
        self,
        requests: list[tuple[str, list[Any] | None]],
    ) -> list[Any]:
        """Make a batch JSON-RPC call."""
        payload = [
            {
                "jsonrpc": "2.0",
                "method": method,
                "params": params or [],
                "id": i + 1,
            }
            for i, (method, params) in enumerate(requests)
        ]

        response = await self.client.post(
            self.rpc_url,
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()

        data = response.json()

        # Sort by id to maintain order
        data.sort(key=lambda x: x.get("id", 0))

        results = []
        for item in data:
            if "error" in item:
                results.append(item["error"])
            else:
                results.append(item.get("result"))

        return results

    # Convenience methods
    async def get_block_number(self) -> int:
        """Get the current block number."""
        result = await self.call("eth_blockNumber")
        return int(result, 16)

    async def get_balance(self, address: str, block: str = "latest") -> int:
        """Get the balance of an address in wei."""
        result = await self.call("eth_getBalance", [address, block])
        return int(result, 16)

    async def get_transaction(self, tx_hash: str) -> dict[str, Any] | None:
        """Get transaction by hash."""
        return await self.call("eth_getTransactionByHash", [tx_hash])

    async def get_transaction_receipt(self, tx_hash: str) -> dict[str, Any] | None:
        """Get transaction receipt by hash."""
        return await self.call("eth_getTransactionReceipt", [tx_hash])

    async def get_logs(
        self,
        from_block: int | str = "latest",
        to_block: int | str = "latest",
        address: str | list[str] | None = None,
        topics: list[str | list[str] | None] | None = None,
    ) -> list[dict[str, Any]]:
        """Get logs matching filter."""
        filter_params: dict[str, Any] = {
            "fromBlock": hex(from_block) if isinstance(from_block, int) else from_block,
            "toBlock": hex(to_block) if isinstance(to_block, int) else to_block,
        }
        if address:
            filter_params["address"] = address
        if topics:
            filter_params["topics"] = topics

        return await self.call("eth_getLogs", [filter_params])

    async def send_raw_transaction(self, signed_tx: str) -> str:
        """Send a signed transaction."""
        return await self.call("eth_sendRawTransaction", [signed_tx])

    async def call_contract(
        self,
        to: str,
        data: str,
        from_address: str | None = None,
        block: str = "latest",
    ) -> str:
        """Call a contract method."""
        call_params: dict[str, Any] = {"to": to, "data": data}
        if from_address:
            call_params["from"] = from_address
        return await self.call("eth_call", [call_params, block])

    async def estimate_gas(
        self,
        to: str,
        data: str | None = None,
        from_address: str | None = None,
        value: int | None = None,
    ) -> int:
        """Estimate gas for a transaction."""
        tx_params: dict[str, Any] = {"to": to}
        if data:
            tx_params["data"] = data
        if from_address:
            tx_params["from"] = from_address
        if value:
            tx_params["value"] = hex(value)

        result = await self.call("eth_estimateGas", [tx_params])
        return int(result, 16)

    async def get_gas_price(self) -> int:
        """Get current gas price."""
        result = await self.call("eth_gasPrice")
        return int(result, 16)

    async def get_chain_id(self) -> int:
        """Get chain ID."""
        result = await self.call("eth_chainId")
        return int(result, 16)
