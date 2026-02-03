"""Chains API - list supported blockchains."""

from fastapi import APIRouter
from pydantic import BaseModel

from bootnode.core.chains import ChainRegistry

router = APIRouter()


class NetworkInfo(BaseModel):
    """Network information."""

    name: str
    chain_id: int | None
    is_testnet: bool
    explorer_url: str | None
    native_currency: str
    native_decimals: int


class ChainInfo(BaseModel):
    """Chain information."""

    name: str
    slug: str
    type: str
    networks: dict[str, NetworkInfo]
    logo_url: str | None


class ChainsResponse(BaseModel):
    """List of supported chains."""

    chains: dict[str, ChainInfo]


@router.get("", response_model=ChainsResponse)
async def list_chains() -> ChainsResponse:
    """List all supported blockchains and networks."""
    chains = ChainRegistry.get_all_chains()

    result = {}
    for slug, chain in chains.items():
        networks = {}
        for net_name, network in chain.networks.items():
            networks[net_name] = NetworkInfo(
                name=network.name,
                chain_id=network.chain_id,
                is_testnet=network.is_testnet,
                explorer_url=network.explorer_url,
                native_currency=network.native_currency,
                native_decimals=network.native_decimals,
            )

        result[slug] = ChainInfo(
            name=chain.name,
            slug=chain.slug,
            type=chain.chain_type.value,
            networks=networks,
            logo_url=chain.logo_url,
        )

    return ChainsResponse(chains=result)


@router.get("/{chain}", response_model=ChainInfo)
async def get_chain(chain: str) -> ChainInfo:
    """Get information about a specific chain."""
    chain_config = ChainRegistry.get_chain(chain)

    if not chain_config:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chain '{chain}' not found",
        )

    networks = {}
    for net_name, network in chain_config.networks.items():
        networks[net_name] = NetworkInfo(
            name=network.name,
            chain_id=network.chain_id,
            is_testnet=network.is_testnet,
            explorer_url=network.explorer_url,
            native_currency=network.native_currency,
            native_decimals=network.native_decimals,
        )

    return ChainInfo(
        name=chain_config.name,
        slug=chain_config.slug,
        type=chain_config.chain_type.value,
        networks=networks,
        logo_url=chain_config.logo_url,
    )
