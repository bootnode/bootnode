"""Transfers API - Transaction history and transfers."""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from bootnode.api.deps import ApiKeyDep
from bootnode.core.chains import ChainRegistry, RPCClient

router = APIRouter()


class Transfer(BaseModel):
    """Transfer/transaction record."""

    hash: str
    block_number: int
    block_hash: str
    timestamp: datetime | None
    from_address: str
    to_address: str | None
    value: str
    gas_used: int | None
    gas_price: str | None
    status: str  # success, failed, pending
    type: str  # native, erc20, erc721, erc1155, internal
    token_address: str | None
    token_id: str | None


class TransfersResponse(BaseModel):
    """Transfers response."""

    address: str
    chain: str
    network: str
    transfers: list[Transfer]
    page: int
    page_size: int
    has_more: bool


class TransactionDetails(BaseModel):
    """Full transaction details."""

    hash: str
    block_number: int | None
    block_hash: str | None
    from_address: str
    to_address: str | None
    value: str
    gas: int
    gas_price: str
    max_fee_per_gas: str | None
    max_priority_fee_per_gas: str | None
    nonce: int
    input: str
    status: str
    gas_used: int | None
    effective_gas_price: str | None
    logs: list[dict[str, Any]] | None


@router.get("/{chain}/address/{address}", response_model=TransfersResponse)
async def get_transfers(
    chain: str,
    address: str,
    api_key: ApiKeyDep,
    network: str = "mainnet",
    from_block: int | None = None,
    to_block: int | None = None,
    page: int = 1,
    page_size: int = 50,
) -> TransfersResponse:
    """
    Get transfers for an address.

    Note: Full transfer history requires indexing. This endpoint provides
    limited functionality by querying recent blocks for Transfer events.
    """
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    address = address.lower()

    # Without a full indexer, we can only fetch recent transfers via logs
    # This is a simplified implementation
    transfers: list[Transfer] = []

    async with RPCClient(chain, network) as client:
        current_block = await client.get_block_number()

        # Default to last 1000 blocks if not specified
        if to_block is None:
            to_block = current_block
        if from_block is None:
            from_block = max(0, to_block - 1000)

        # Limit range to prevent excessive queries
        if to_block - from_block > 10000:
            from_block = to_block - 10000

        # Get ERC-20 Transfer events
        # Transfer(address indexed from, address indexed to, uint256 value)
        transfer_topic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        address_padded = "0x000000000000000000000000" + address[2:]

        try:
            # Get transfers TO address
            logs_to = await client.get_logs(
                from_block=from_block,
                to_block=to_block,
                topics=[transfer_topic, None, address_padded],
            )

            # Get transfers FROM address
            logs_from = await client.get_logs(
                from_block=from_block,
                to_block=to_block,
                topics=[transfer_topic, address_padded, None],
            )

            all_logs = logs_to + logs_from

            for log in all_logs[:page_size]:
                transfers.append(Transfer(
                    hash=log["transactionHash"],
                    block_number=int(log["blockNumber"], 16),
                    block_hash=log["blockHash"],
                    timestamp=None,  # Would need to fetch block for timestamp
                    from_address="0x" + log["topics"][1][-40:] if len(log["topics"]) > 1 else "",
                    to_address="0x" + log["topics"][2][-40:] if len(log["topics"]) > 2 else None,
                    value=str(int(log["data"], 16)) if log["data"] != "0x" else "0",
                    gas_used=None,
                    gas_price=None,
                    status="success",
                    type="erc20",
                    token_address=log["address"],
                    token_id=None,
                ))

        except Exception:
            # Log query may fail for various reasons
            pass

    return TransfersResponse(
        address=address,
        chain=chain,
        network=network,
        transfers=transfers,
        page=page,
        page_size=page_size,
        has_more=len(transfers) >= page_size,
    )


@router.get("/{chain}/tx/{tx_hash}", response_model=TransactionDetails)
async def get_transaction(
    chain: str,
    tx_hash: str,
    api_key: ApiKeyDep,
    network: str = "mainnet",
) -> TransactionDetails:
    """Get detailed information about a transaction."""
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    async with RPCClient(chain, network) as client:
        tx = await client.get_transaction(tx_hash)
        receipt = await client.get_transaction_receipt(tx_hash)

        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found",
            )

        status_str = "pending"
        if receipt:
            status_str = "success" if receipt.get("status") == "0x1" else "failed"

        return TransactionDetails(
            hash=tx["hash"],
            block_number=int(tx["blockNumber"], 16) if tx.get("blockNumber") else None,
            block_hash=tx.get("blockHash"),
            from_address=tx["from"],
            to_address=tx.get("to"),
            value=str(int(tx["value"], 16)),
            gas=int(tx["gas"], 16),
            gas_price=str(int(tx.get("gasPrice", "0x0"), 16)),
            max_fee_per_gas=str(int(tx["maxFeePerGas"], 16)) if tx.get("maxFeePerGas") else None,
            max_priority_fee_per_gas=str(int(tx["maxPriorityFeePerGas"], 16)) if tx.get("maxPriorityFeePerGas") else None,
            nonce=int(tx["nonce"], 16),
            input=tx.get("input", "0x"),
            status=status_str,
            gas_used=int(receipt["gasUsed"], 16) if receipt else None,
            effective_gas_price=str(int(receipt["effectiveGasPrice"], 16)) if receipt and receipt.get("effectiveGasPrice") else None,
            logs=receipt.get("logs") if receipt else None,
        )


@router.post("/{chain}/send")
async def send_transaction(
    chain: str,
    api_key: ApiKeyDep,
    signed_tx: str,
    network: str = "mainnet",
) -> dict:
    """Send a signed transaction."""
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    async with RPCClient(chain, network) as client:
        tx_hash = await client.send_raw_transaction(signed_tx)

        return {
            "hash": tx_hash,
            "chain": chain,
            "network": network,
            "status": "pending",
        }
