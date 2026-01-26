"""API tests."""

import pytest
from httpx import AsyncClient, ASGITransport

from bootnode.main import app


@pytest.fixture
async def client():
    """Create test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


@pytest.mark.asyncio
async def test_root(client: AsyncClient):
    """Test root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Bootnode API"


@pytest.mark.asyncio
async def test_list_chains(client: AsyncClient):
    """Test chains list endpoint."""
    response = await client.get("/v1/chains")
    assert response.status_code == 200
    data = response.json()
    assert "chains" in data
    assert "ethereum" in data["chains"]
    assert "polygon" in data["chains"]


@pytest.mark.asyncio
async def test_get_chain(client: AsyncClient):
    """Test get specific chain."""
    response = await client.get("/v1/chains/ethereum")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Ethereum"
    assert "mainnet" in data["networks"]
    assert "sepolia" in data["networks"]


@pytest.mark.asyncio
async def test_get_chain_not_found(client: AsyncClient):
    """Test get nonexistent chain."""
    response = await client.get("/v1/chains/notachain")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_rpc_without_auth(client: AsyncClient):
    """Test RPC endpoint without authentication."""
    response = await client.post(
        "/v1/rpc/ethereum/mainnet",
        json={"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1}
    )
    assert response.status_code == 401
