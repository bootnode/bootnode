"""Bundler API - ERC-4337 UserOperation bundler."""

from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from bootnode.api.deps import ApiKeyDep
from bootnode.core.chains import ChainRegistry, RPCClient

router = APIRouter()


# EntryPoint addresses
ENTRY_POINT_V06 = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
ENTRY_POINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"


class UserOperation(BaseModel):
    """ERC-4337 UserOperation (v0.6 format)."""

    sender: str
    nonce: str
    initCode: str = "0x"
    callData: str = "0x"
    callGasLimit: str
    verificationGasLimit: str
    preVerificationGas: str
    maxFeePerGas: str
    maxPriorityFeePerGas: str
    paymasterAndData: str = "0x"
    signature: str


class PackedUserOperation(BaseModel):
    """ERC-4337 PackedUserOperation (v0.7 format)."""

    sender: str
    nonce: str
    initCode: str = "0x"
    callData: str = "0x"
    accountGasLimits: str  # Packed: verificationGasLimit | callGasLimit
    preVerificationGas: str
    gasFees: str  # Packed: maxPriorityFeePerGas | maxFeePerGas
    paymasterAndData: str = "0x"
    signature: str


class JsonRpcRequest(BaseModel):
    """JSON-RPC 2.0 request."""

    jsonrpc: str = "2.0"
    method: str
    params: list[Any]
    id: int | str = 1


class JsonRpcResponse(BaseModel):
    """JSON-RPC 2.0 response."""

    jsonrpc: str = "2.0"
    result: Any | None = None
    error: dict[str, Any] | None = None
    id: int | str | None = None


# Supported bundler methods
BUNDLER_METHODS = {
    "eth_sendUserOperation",
    "eth_estimateUserOperationGas",
    "eth_getUserOperationByHash",
    "eth_getUserOperationReceipt",
    "eth_supportedEntryPoints",
    "eth_chainId",
    "pm_getPaymasterData",  # Paymaster extension
    "pm_getPaymasterStubData",
}


@router.post("/{chain}")
@router.post("/{chain}/{network}")
async def bundler_rpc(
    chain: str,
    request: JsonRpcRequest,
    api_key: ApiKeyDep,
    network: str = "mainnet",
) -> JsonRpcResponse:
    """
    ERC-4337 Bundler JSON-RPC endpoint.

    Supported methods:
    - eth_sendUserOperation
    - eth_estimateUserOperationGas
    - eth_getUserOperationByHash
    - eth_getUserOperationReceipt
    - eth_supportedEntryPoints
    - eth_chainId
    """
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    method = request.method

    if method not in BUNDLER_METHODS:
        return JsonRpcResponse(
            jsonrpc="2.0",
            error={
                "code": -32601,
                "message": f"Method not found: {method}",
            },
            id=request.id,
        )

    try:
        if method == "eth_supportedEntryPoints":
            return JsonRpcResponse(
                jsonrpc="2.0",
                result=[ENTRY_POINT_V06, ENTRY_POINT_V07],
                id=request.id,
            )

        if method == "eth_chainId":
            chain_config = ChainRegistry.get_chain(chain)
            network_config = chain_config.networks.get(network) if chain_config else None
            chain_id = network_config.chain_id if network_config else 1
            return JsonRpcResponse(
                jsonrpc="2.0",
                result=hex(chain_id),
                id=request.id,
            )

        if method == "eth_sendUserOperation":
            return await _handle_send_user_operation(
                chain, network, request.params, request.id
            )

        if method == "eth_estimateUserOperationGas":
            return await _handle_estimate_user_operation_gas(
                chain, network, request.params, request.id
            )

        if method == "eth_getUserOperationByHash":
            return await _handle_get_user_operation_by_hash(
                chain, network, request.params, request.id
            )

        if method == "eth_getUserOperationReceipt":
            return await _handle_get_user_operation_receipt(
                chain, network, request.params, request.id
            )

        return JsonRpcResponse(
            jsonrpc="2.0",
            error={
                "code": -32601,
                "message": "Method not implemented",
            },
            id=request.id,
        )

    except Exception as e:
        return JsonRpcResponse(
            jsonrpc="2.0",
            error={
                "code": -32603,
                "message": f"Internal error: {str(e)}",
            },
            id=request.id,
        )


async def _handle_send_user_operation(
    chain: str,
    network: str,
    params: list[Any],
    request_id: int | str,
) -> JsonRpcResponse:
    """Handle eth_sendUserOperation."""
    if len(params) < 2:
        return JsonRpcResponse(
            jsonrpc="2.0",
            error={
                "code": -32602,
                "message": "Invalid params: expected [userOp, entryPoint]",
            },
            id=request_id,
        )

    user_op = params[0]
    entry_point = params[1]

    if entry_point not in [ENTRY_POINT_V06, ENTRY_POINT_V07]:
        return JsonRpcResponse(
            jsonrpc="2.0",
            error={
                "code": -32602,
                "message": f"Unsupported EntryPoint: {entry_point}",
            },
            id=request_id,
        )

    # In production, this would:
    # 1. Validate the UserOperation
    # 2. Simulate it on-chain
    # 3. Add it to the mempool
    # 4. Bundle and submit to the network

    # For now, we'll compute the userOpHash and return it
    user_op_hash = _compute_user_op_hash(user_op, entry_point, chain, network)

    # In a real implementation, queue the UserOp for bundling
    return JsonRpcResponse(
        jsonrpc="2.0",
        result=user_op_hash,
        id=request_id,
    )


async def _handle_estimate_user_operation_gas(
    chain: str,
    network: str,
    params: list[Any],
    request_id: int | str,
) -> JsonRpcResponse:
    """Handle eth_estimateUserOperationGas."""
    if len(params) < 2:
        return JsonRpcResponse(
            jsonrpc="2.0",
            error={
                "code": -32602,
                "message": "Invalid params: expected [userOp, entryPoint]",
            },
            id=request_id,
        )

    user_op = params[0]
    # Entry point validation will be implemented with full ERC-4337 support

    async with RPCClient(chain, network) as client:
        # Get gas prices
        gas_price = await client.get_gas_price()

        try:
            max_priority_fee = await client.call("eth_maxPriorityFeePerGas", [])
            max_priority_fee_int = int(max_priority_fee, 16)

            block = await client.call("eth_getBlockByNumber", ["latest", False])
            base_fee = int(block.get("baseFeePerGas", "0x0"), 16)
            max_fee = base_fee * 2 + max_priority_fee_int
        except Exception:
            max_priority_fee_int = gas_price // 10
            max_fee = gas_price

        # Estimate gas limits (simplified)
        # Real implementation would simulate the UserOp
        pre_verification_gas = 21000 + len(user_op.get("callData", "0x")) * 4
        verification_gas = 100000
        call_gas = 100000

        return JsonRpcResponse(
            jsonrpc="2.0",
            result={
                "preVerificationGas": hex(pre_verification_gas),
                "verificationGasLimit": hex(verification_gas),
                "callGasLimit": hex(call_gas),
                "maxFeePerGas": hex(max_fee),
                "maxPriorityFeePerGas": hex(max_priority_fee_int),
            },
            id=request_id,
        )


async def _handle_get_user_operation_by_hash(
    chain: str,
    network: str,
    params: list[Any],
    request_id: int | str,
) -> JsonRpcResponse:
    """Handle eth_getUserOperationByHash."""
    if not params:
        return JsonRpcResponse(
            jsonrpc="2.0",
            error={
                "code": -32602,
                "message": "Invalid params: expected [userOpHash]",
            },
            id=request_id,
        )

    # UserOperation lookup will be implemented with database storage

    # In production, look up the UserOp from storage
    # For now, return null (not found)
    return JsonRpcResponse(
        jsonrpc="2.0",
        result=None,
        id=request_id,
    )


async def _handle_get_user_operation_receipt(
    chain: str,
    network: str,
    params: list[Any],
    request_id: int | str,
) -> JsonRpcResponse:
    """Handle eth_getUserOperationReceipt."""
    if not params:
        return JsonRpcResponse(
            jsonrpc="2.0",
            error={
                "code": -32602,
                "message": "Invalid params: expected [userOpHash]",
            },
            id=request_id,
        )

    # UserOperation receipt lookup will be implemented with database storage

    # In production, look up the receipt from storage
    # For now, return null (not found)
    return JsonRpcResponse(
        jsonrpc="2.0",
        result=None,
        id=request_id,
    )


def _compute_user_op_hash(
    user_op: dict[str, Any],
    entry_point: str,
    chain: str,
    network: str,
) -> str:
    """Compute the UserOperation hash per ERC-4337 spec.

    userOpHash = keccak256(abi.encode(
        pack(userOp), entryPoint, chainId
    ))
    where pack(userOp) = keccak256 of ABI-encoded UserOp fields (excluding signature).
    """
    from eth_abi import encode
    from web3 import Web3

    chain_config = ChainRegistry.get_chain(chain)
    network_config = chain_config.networks.get(network) if chain_config else None
    chain_id = network_config.chain_id if network_config else 1

    def _hex_to_bytes(h: str) -> bytes:
        h = h or "0x"
        return bytes.fromhex(h[2:] if h.startswith("0x") else h)

    def _hex_to_int(h: str) -> int:
        h = h or "0x0"
        return int(h, 16)

    # Pack the UserOperation (hash of all fields except signature)
    packed = encode(
        ["address", "uint256", "bytes32", "bytes32", "uint256", "uint256", "uint256", "uint256", "uint256", "bytes32"],
        [
            Web3.to_checksum_address(user_op.get("sender", "0x" + "0" * 40)),
            _hex_to_int(user_op.get("nonce", "0x0")),
            Web3.keccak(_hex_to_bytes(user_op.get("initCode", "0x"))),
            Web3.keccak(_hex_to_bytes(user_op.get("callData", "0x"))),
            _hex_to_int(user_op.get("callGasLimit", "0x0")),
            _hex_to_int(user_op.get("verificationGasLimit", "0x0")),
            _hex_to_int(user_op.get("preVerificationGas", "0x0")),
            _hex_to_int(user_op.get("maxFeePerGas", "0x0")),
            _hex_to_int(user_op.get("maxPriorityFeePerGas", "0x0")),
            Web3.keccak(_hex_to_bytes(user_op.get("paymasterAndData", "0x"))),
        ],
    )
    user_op_packed_hash = Web3.keccak(packed)

    # Final hash: keccak256(abi.encode(userOpHash, entryPoint, chainId))
    final = encode(
        ["bytes32", "address", "uint256"],
        [
            user_op_packed_hash,
            Web3.to_checksum_address(entry_point),
            chain_id,
        ],
    )

    return "0x" + Web3.keccak(final).hex()
