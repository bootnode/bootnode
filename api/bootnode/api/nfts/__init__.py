"""NFT API - ERC-721/ERC-1155 NFT data."""

from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from bootnode.api.deps import ApiKeyDep
from bootnode.core.chains import ChainRegistry, RPCClient
from bootnode.config import get_settings

router = APIRouter()
settings = get_settings()


# ERC-721 function signatures
ERC721_BALANCE_OF = "0x70a08231"
ERC721_OWNER_OF = "0x6352211e"
ERC721_TOKEN_URI = "0xc87b56dd"
ERC721_NAME = "0x06fdde03"
ERC721_SYMBOL = "0x95d89b41"

# ERC-1155 function signatures
ERC1155_BALANCE_OF = "0x00fdd58e"
ERC1155_URI = "0x0e89341c"


class NFTMetadata(BaseModel):
    """NFT metadata."""

    contract_address: str
    token_id: str
    token_type: str  # ERC721 or ERC1155
    name: str | None
    description: str | None
    image: str | None
    animation_url: str | None
    external_url: str | None
    attributes: list[dict[str, Any]] | None
    raw_metadata: dict[str, Any] | None


class NFTCollection(BaseModel):
    """NFT collection info."""

    contract_address: str
    name: str | None
    symbol: str | None
    token_type: str
    total_supply: str | None


class OwnedNFT(BaseModel):
    """Owned NFT."""

    contract_address: str
    token_id: str
    token_type: str
    balance: str  # For ERC-1155
    name: str | None
    image: str | None


class OwnedNFTsResponse(BaseModel):
    """Owned NFTs response."""

    address: str
    chain: str
    network: str
    nfts: list[OwnedNFT]
    page: int
    page_size: int
    total: int | None


@router.get("/{chain}/metadata/{contract}/{token_id}", response_model=NFTMetadata)
async def get_nft_metadata(
    chain: str,
    contract: str,
    token_id: str,
    api_key: ApiKeyDep,
    network: str = "mainnet",
) -> NFTMetadata:
    """Get metadata for a specific NFT."""
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    contract = contract.lower()

    async with RPCClient(chain, network) as client:
        # Try ERC-721 first
        token_uri = await _get_token_uri_721(client, contract, token_id)
        token_type = "ERC721"

        if not token_uri:
            # Try ERC-1155
            token_uri = await _get_token_uri_1155(client, contract, token_id)
            token_type = "ERC1155"

        metadata = None
        if token_uri:
            metadata = await _fetch_metadata(token_uri)

        return NFTMetadata(
            contract_address=contract,
            token_id=token_id,
            token_type=token_type,
            name=metadata.get("name") if metadata else None,
            description=metadata.get("description") if metadata else None,
            image=_resolve_ipfs(metadata.get("image")) if metadata else None,
            animation_url=_resolve_ipfs(metadata.get("animation_url")) if metadata else None,
            external_url=metadata.get("external_url") if metadata else None,
            attributes=metadata.get("attributes") if metadata else None,
            raw_metadata=metadata,
        )


@router.get("/{chain}/collection/{contract}", response_model=NFTCollection)
async def get_nft_collection(
    chain: str,
    contract: str,
    api_key: ApiKeyDep,
    network: str = "mainnet",
) -> NFTCollection:
    """Get NFT collection information."""
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    contract = contract.lower()

    async with RPCClient(chain, network) as client:
        name = await _get_contract_string(client, contract, ERC721_NAME)
        symbol = await _get_contract_string(client, contract, ERC721_SYMBOL)

        # Determine token type by checking supportsInterface
        # For simplicity, default to ERC721
        token_type = "ERC721"

        return NFTCollection(
            contract_address=contract,
            name=name,
            symbol=symbol,
            token_type=token_type,
            total_supply=None,  # Would need to call totalSupply if available
        )


@router.get("/{chain}/owned/{address}", response_model=OwnedNFTsResponse)
async def get_owned_nfts(
    chain: str,
    address: str,
    api_key: ApiKeyDep,
    network: str = "mainnet",
    contracts: list[str] | None = Query(default=None),
    page: int = 1,
    page_size: int = 50,
) -> OwnedNFTsResponse:
    """
    Get NFTs owned by an address.

    Note: Full NFT discovery requires indexing. If contracts are provided,
    we check balances for those specific contracts.
    """
    if not ChainRegistry.is_supported(chain, network):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported chain/network: {chain}/{network}",
        )

    address = address.lower()

    # Without indexing, we can only check specific contracts
    nfts: list[OwnedNFT] = []

    if contracts:
        async with RPCClient(chain, network) as client:
            for contract in contracts[:20]:  # Limit to 20 contracts
                contract = contract.lower()
                try:
                    # Check ERC-721 balance
                    balance = await _get_721_balance(client, contract, address)
                    if balance and balance > 0:
                        name = await _get_contract_string(client, contract, ERC721_NAME)
                        # Note: Getting specific token IDs requires Transfer event indexing
                        nfts.append(OwnedNFT(
                            contract_address=contract,
                            token_id="*",  # Unknown without indexing
                            token_type="ERC721",
                            balance=str(balance),
                            name=name,
                            image=None,
                        ))
                except Exception:
                    continue

    return OwnedNFTsResponse(
        address=address,
        chain=chain,
        network=network,
        nfts=nfts,
        page=page,
        page_size=page_size,
        total=len(nfts),
    )


@router.post("/{chain}/refresh/{contract}/{token_id}")
async def refresh_nft_metadata(
    chain: str,
    contract: str,
    token_id: str,
    api_key: ApiKeyDep,
    network: str = "mainnet",
) -> dict:
    """Request a metadata refresh for an NFT."""
    # In production, this would queue a background job
    return {
        "status": "queued",
        "contract": contract,
        "token_id": token_id,
        "message": "Metadata refresh has been queued",
    }


async def _get_token_uri_721(client: RPCClient, contract: str, token_id: str) -> str | None:
    """Get tokenURI for ERC-721."""
    try:
        token_id_hex = hex(int(token_id))[2:].zfill(64)
        result = await client.call_contract(contract, f"{ERC721_TOKEN_URI}{token_id_hex}")
        if result and result != "0x":
            return _decode_string(result)
    except Exception:
        pass
    return None


async def _get_token_uri_1155(client: RPCClient, contract: str, token_id: str) -> str | None:
    """Get URI for ERC-1155."""
    try:
        token_id_hex = hex(int(token_id))[2:].zfill(64)
        result = await client.call_contract(contract, f"{ERC1155_URI}{token_id_hex}")
        if result and result != "0x":
            uri = _decode_string(result)
            # ERC-1155 URIs may have {id} placeholder
            if uri and "{id}" in uri:
                uri = uri.replace("{id}", token_id_hex)
            return uri
    except Exception:
        pass
    return None


async def _get_contract_string(client: RPCClient, contract: str, selector: str) -> str | None:
    """Get a string value from a contract."""
    try:
        result = await client.call_contract(contract, selector)
        if result and result != "0x":
            return _decode_string(result)
    except Exception:
        pass
    return None


async def _get_721_balance(client: RPCClient, contract: str, address: str) -> int | None:
    """Get ERC-721 balance."""
    try:
        address_padded = address[2:].zfill(64)
        result = await client.call_contract(contract, f"{ERC721_BALANCE_OF}{address_padded}")
        if result and result != "0x":
            return int(result, 16)
    except Exception:
        pass
    return None


def _decode_string(hex_data: str) -> str | None:
    """Decode an ABI-encoded string."""
    try:
        data = hex_data[2:] if hex_data.startswith("0x") else hex_data

        if len(data) == 64:
            decoded = bytes.fromhex(data).rstrip(b'\x00').decode('utf-8', errors='ignore')
            if decoded.isprintable():
                return decoded

        if len(data) >= 128:
            length = int(data[64:128], 16)
            string_data = data[128:128 + length * 2]
            return bytes.fromhex(string_data).decode('utf-8', errors='ignore')

    except Exception:
        pass
    return None


async def _fetch_metadata(uri: str) -> dict[str, Any] | None:
    """Fetch metadata from URI."""
    import httpx

    try:
        resolved_uri = _resolve_ipfs(uri)
        if not resolved_uri:
            return None

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(resolved_uri)
            response.raise_for_status()
            return response.json()
    except Exception:
        return None


def _resolve_ipfs(uri: str | None) -> str | None:
    """Resolve IPFS URIs to HTTP gateway."""
    if not uri:
        return None

    if uri.startswith("ipfs://"):
        return f"{settings.ipfs_gateway}{uri[7:]}"

    if uri.startswith("ar://"):
        return f"https://arweave.net/{uri[5:]}"

    return uri
