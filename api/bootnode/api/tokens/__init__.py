"""Token API - ERC-20/ERC-721/ERC-1155 token data."""

from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from bootnode.api.deps import ApiKeyDep
from bootnode.core.chains import ChainRegistry, RPCClient

router = APIRouter()


# Common ERC-20 ABI function signatures
ERC20_BALANCE_OF = "0x70a08231"  # balanceOf(address)
ERC20_DECIMALS = "0x313ce567"  # decimals()
ERC20_SYMBOL = "0x95d89b41"  # symbol()
ERC20_NAME = "0x06fdde03"  # name()
ERC20_TOTAL_SUPPLY = "0x18160ddd"  # totalSupply()


class TokenBalance(BaseModel):
    """Token balance response."""

    contract_address: str
    token_type: str  # ERC20, ERC721, ERC1155
    name: str | None
    symbol: str | None
    decimals: int | None
    balance: str  # Raw balance as string
    balance_formatted: str | None  # Human-readable


class TokenMetadata(BaseModel):
    """Token metadata response."""

    contract_address: str
    name: str | None
    symbol: str | None
    decimals: int | None
    total_supply: str | None
    logo_url: str | None


class BalancesResponse(BaseModel):
    """Token balances response."""

    address: str
    chain: str
    network: str
    native_balance: str
    native_balance_formatted: str
    tokens: list[TokenBalance]


@router.get("/{chain}/balances/{address}", response_model=BalancesResponse)
async def get_token_balances(
    chain: str,
    address: str,
    api_key: ApiKeyDep,
    network: str = "mainnet",
    token_addresses: list[str] | None = Query(default=None),
) -> BalancesResponse:
    """
    Get token balances for an address.

    If token_addresses is provided, only those tokens are queried.
    Otherwise, returns native balance only (full token discovery requires indexing).
    """
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    # Normalize address
    address = address.lower()
    if not address.startswith("0x") or len(address) != 42:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid address format",
        )

    chain_config = ChainRegistry.get_chain(chain)
    network_config = chain_config.networks.get(network) if chain_config else None

    async with RPCClient(chain, network) as client:
        # Get native balance
        native_balance = await client.get_balance(address)
        native_decimals = network_config.native_decimals if network_config else 18
        native_formatted = _format_balance(native_balance, native_decimals)

        tokens = []

        # Get specific token balances if requested
        if token_addresses:
            for token_addr in token_addresses[:50]:  # Limit to 50 tokens
                token_addr = token_addr.lower()
                try:
                    # Get balance
                    balance_data = address[2:].zfill(64)
                    balance_result = await client.call_contract(
                        token_addr,
                        f"{ERC20_BALANCE_OF}000000000000000000000000{balance_data}",
                    )
                    balance = int(balance_result, 16) if balance_result != "0x" else 0

                    # Get metadata (batch call would be more efficient)
                    name = await _get_token_string(client, token_addr, ERC20_NAME)
                    symbol = await _get_token_string(client, token_addr, ERC20_SYMBOL)
                    decimals = await _get_token_decimals(client, token_addr)

                    tokens.append(TokenBalance(
                        contract_address=token_addr,
                        token_type="ERC20",
                        name=name,
                        symbol=symbol,
                        decimals=decimals,
                        balance=str(balance),
                        balance_formatted=_format_balance(balance, decimals or 18),
                    ))
                except Exception:
                    # Skip tokens that fail
                    continue

        return BalancesResponse(
            address=address,
            chain=chain,
            network=network,
            native_balance=str(native_balance),
            native_balance_formatted=native_formatted,
            tokens=tokens,
        )


@router.get("/{chain}/metadata/{contract}", response_model=TokenMetadata)
async def get_token_metadata(
    chain: str,
    contract: str,
    api_key: ApiKeyDep,
    network: str = "mainnet",
) -> TokenMetadata:
    """Get metadata for a token contract."""
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    contract = contract.lower()

    async with RPCClient(chain, network) as client:
        name = await _get_token_string(client, contract, ERC20_NAME)
        symbol = await _get_token_string(client, contract, ERC20_SYMBOL)
        decimals = await _get_token_decimals(client, contract)

        # Get total supply
        try:
            supply_result = await client.call_contract(contract, ERC20_TOTAL_SUPPLY)
            total_supply = str(int(supply_result, 16)) if supply_result != "0x" else None
        except Exception:
            total_supply = None

        return TokenMetadata(
            contract_address=contract,
            name=name,
            symbol=symbol,
            decimals=decimals,
            total_supply=total_supply,
            logo_url=None,  # Would need external source
        )


async def _get_token_string(client: RPCClient, contract: str, selector: str) -> str | None:
    """Get a string value from a token contract."""
    try:
        result = await client.call_contract(contract, selector)
        if result and result != "0x":
            # Decode string from ABI encoding
            return _decode_string(result)
    except Exception:
        pass
    return None


async def _get_token_decimals(client: RPCClient, contract: str) -> int | None:
    """Get decimals from a token contract."""
    try:
        result = await client.call_contract(contract, ERC20_DECIMALS)
        if result and result != "0x":
            return int(result, 16)
    except Exception:
        pass
    return None


def _decode_string(hex_data: str) -> str | None:
    """Decode an ABI-encoded string."""
    try:
        # Remove 0x prefix
        data = hex_data[2:] if hex_data.startswith("0x") else hex_data

        # Handle short strings (packed in 32 bytes)
        if len(data) == 64:
            # Check if it's a short string
            decoded = bytes.fromhex(data).rstrip(b'\x00').decode('utf-8', errors='ignore')
            if decoded.isprintable():
                return decoded

        # Handle dynamic strings
        if len(data) >= 128:
            # Skip offset (32 bytes) and get length (32 bytes)
            length = int(data[64:128], 16)
            # Get string data
            string_data = data[128:128 + length * 2]
            return bytes.fromhex(string_data).decode('utf-8', errors='ignore')

    except Exception:
        pass
    return None


def _format_balance(balance: int, decimals: int) -> str:
    """Format a balance with decimals."""
    if decimals == 0:
        return str(balance)

    balance_str = str(balance).zfill(decimals + 1)
    integer_part = balance_str[:-decimals] or "0"
    decimal_part = balance_str[-decimals:].rstrip("0") or "0"

    if decimal_part == "0":
        return integer_part

    return f"{integer_part}.{decimal_part}"
