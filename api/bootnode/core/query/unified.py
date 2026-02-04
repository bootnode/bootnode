"""Unified Query Client - Single interface for all storage backends.

Provides a unified interface to query blockchain data across:
- PostgreSQL (metadata, indexes)
- ClickHouse (analytics, time-series)
- Qdrant (vector/semantic search)
- Meilisearch (full-text search)
- Lux Indexer (real-time chain data)
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

import httpx
import structlog

from bootnode.config import get_settings

logger = structlog.get_logger()


class QueryType(str, Enum):
    """Query type determines which backend to use."""
    METADATA = "metadata"      # PostgreSQL
    ANALYTICS = "analytics"    # ClickHouse
    SEMANTIC = "semantic"      # Qdrant (vector)
    FULLTEXT = "fulltext"      # Meilisearch
    REALTIME = "realtime"      # Lux Indexer
    HYBRID = "hybrid"          # Multiple backends


@dataclass
class QueryResult:
    """Unified query result."""
    data: list[dict]
    total: int
    query_type: QueryType
    took_ms: float
    chain: str | None = None
    network: str | None = None
    cursor: str | None = None
    metadata: dict = field(default_factory=dict)


@dataclass
class SearchResult:
    """Search result with relevance scoring."""
    items: list[dict]
    total: int
    query: str
    took_ms: float
    facets: dict = field(default_factory=dict)


class UnifiedQueryClient:
    """Unified client for querying all storage backends."""

    def __init__(self) -> None:
        settings = get_settings()
        self.indexer_url = getattr(settings, "indexer_url", "http://localhost:5000")
        self._timeout = httpx.Timeout(30.0)

    # =========================================================================
    # Block Queries
    # =========================================================================

    async def get_block(
        self,
        chain: str,
        network: str,
        block_number: int | str,
    ) -> QueryResult:
        """Get block by number or hash."""
        start = datetime.now()

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            # Query Lux Indexer
            response = await client.get(
                f"{self.indexer_url}/api/v2/{chain}/{network}/blocks/{block_number}"
            )

            if response.status_code == 200:
                data = response.json()
                return QueryResult(
                    data=[data],
                    total=1,
                    query_type=QueryType.REALTIME,
                    took_ms=(datetime.now() - start).total_seconds() * 1000,
                    chain=chain,
                    network=network,
                )

            return QueryResult(
                data=[],
                total=0,
                query_type=QueryType.REALTIME,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
                chain=chain,
                network=network,
            )

    async def get_blocks(
        self,
        chain: str,
        network: str,
        limit: int = 20,
        cursor: str | None = None,
    ) -> QueryResult:
        """Get recent blocks with pagination."""
        start = datetime.now()

        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self.indexer_url}/api/v2/{chain}/{network}/blocks",
                params=params,
            )

            if response.status_code == 200:
                data = response.json()
                return QueryResult(
                    data=data.get("items", []),
                    total=data.get("total", len(data.get("items", []))),
                    query_type=QueryType.REALTIME,
                    took_ms=(datetime.now() - start).total_seconds() * 1000,
                    chain=chain,
                    network=network,
                    cursor=data.get("next_cursor"),
                )

            return QueryResult(
                data=[],
                total=0,
                query_type=QueryType.REALTIME,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
                chain=chain,
                network=network,
            )

    # =========================================================================
    # Transaction Queries
    # =========================================================================

    async def get_transaction(
        self,
        chain: str,
        network: str,
        tx_hash: str,
    ) -> QueryResult:
        """Get transaction by hash."""
        start = datetime.now()

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self.indexer_url}/api/v2/{chain}/{network}/transactions/{tx_hash}"
            )

            if response.status_code == 200:
                data = response.json()
                return QueryResult(
                    data=[data],
                    total=1,
                    query_type=QueryType.REALTIME,
                    took_ms=(datetime.now() - start).total_seconds() * 1000,
                    chain=chain,
                    network=network,
                )

            return QueryResult(
                data=[],
                total=0,
                query_type=QueryType.REALTIME,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
                chain=chain,
                network=network,
            )

    async def get_transactions(
        self,
        chain: str,
        network: str,
        address: str | None = None,
        block_number: int | None = None,
        limit: int = 20,
        cursor: str | None = None,
    ) -> QueryResult:
        """Get transactions with optional filters."""
        start = datetime.now()

        params: dict[str, Any] = {"limit": limit}
        if cursor:
            params["cursor"] = cursor

        # Determine endpoint based on filters
        if address:
            endpoint = f"{self.indexer_url}/api/v2/{chain}/{network}/addresses/{address}/transactions"
        elif block_number:
            endpoint = f"{self.indexer_url}/api/v2/{chain}/{network}/blocks/{block_number}/transactions"
        else:
            endpoint = f"{self.indexer_url}/api/v2/{chain}/{network}/transactions"

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(endpoint, params=params)

            if response.status_code == 200:
                data = response.json()
                return QueryResult(
                    data=data.get("items", []),
                    total=data.get("total", len(data.get("items", []))),
                    query_type=QueryType.REALTIME,
                    took_ms=(datetime.now() - start).total_seconds() * 1000,
                    chain=chain,
                    network=network,
                    cursor=data.get("next_cursor"),
                )

            return QueryResult(
                data=[],
                total=0,
                query_type=QueryType.REALTIME,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
                chain=chain,
                network=network,
            )

    # =========================================================================
    # Address Queries
    # =========================================================================

    async def get_address(
        self,
        chain: str,
        network: str,
        address: str,
    ) -> QueryResult:
        """Get address details including balance, token holdings."""
        start = datetime.now()

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self.indexer_url}/api/v2/{chain}/{network}/addresses/{address}"
            )

            if response.status_code == 200:
                data = response.json()
                return QueryResult(
                    data=[data],
                    total=1,
                    query_type=QueryType.REALTIME,
                    took_ms=(datetime.now() - start).total_seconds() * 1000,
                    chain=chain,
                    network=network,
                )

            return QueryResult(
                data=[],
                total=0,
                query_type=QueryType.REALTIME,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
                chain=chain,
                network=network,
            )

    async def get_address_tokens(
        self,
        chain: str,
        network: str,
        address: str,
        limit: int = 50,
    ) -> QueryResult:
        """Get token balances for an address."""
        start = datetime.now()

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self.indexer_url}/api/v2/{chain}/{network}/addresses/{address}/tokens",
                params={"limit": limit},
            )

            if response.status_code == 200:
                data = response.json()
                return QueryResult(
                    data=data.get("items", []),
                    total=data.get("total", 0),
                    query_type=QueryType.REALTIME,
                    took_ms=(datetime.now() - start).total_seconds() * 1000,
                    chain=chain,
                    network=network,
                )

            return QueryResult(
                data=[],
                total=0,
                query_type=QueryType.REALTIME,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
                chain=chain,
                network=network,
            )

    # =========================================================================
    # Token Queries
    # =========================================================================

    async def get_token(
        self,
        chain: str,
        network: str,
        address: str,
    ) -> QueryResult:
        """Get token details by contract address."""
        start = datetime.now()

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self.indexer_url}/api/v2/{chain}/{network}/tokens/{address}"
            )

            if response.status_code == 200:
                data = response.json()
                return QueryResult(
                    data=[data],
                    total=1,
                    query_type=QueryType.REALTIME,
                    took_ms=(datetime.now() - start).total_seconds() * 1000,
                    chain=chain,
                    network=network,
                )

            return QueryResult(
                data=[],
                total=0,
                query_type=QueryType.REALTIME,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
                chain=chain,
                network=network,
            )

    async def get_tokens(
        self,
        chain: str,
        network: str,
        query: str | None = None,
        limit: int = 50,
        cursor: str | None = None,
    ) -> QueryResult:
        """Get tokens with optional search query."""
        start = datetime.now()

        params: dict[str, Any] = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        if query:
            params["q"] = query

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self.indexer_url}/api/v2/{chain}/{network}/tokens",
                params=params,
            )

            if response.status_code == 200:
                data = response.json()
                return QueryResult(
                    data=data.get("items", []),
                    total=data.get("total", 0),
                    query_type=QueryType.REALTIME,
                    took_ms=(datetime.now() - start).total_seconds() * 1000,
                    chain=chain,
                    network=network,
                    cursor=data.get("next_cursor"),
                )

            return QueryResult(
                data=[],
                total=0,
                query_type=QueryType.REALTIME,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
                chain=chain,
                network=network,
            )

    # =========================================================================
    # Contract Queries
    # =========================================================================

    async def get_contract(
        self,
        chain: str,
        network: str,
        address: str,
    ) -> QueryResult:
        """Get verified contract with ABI and source code."""
        start = datetime.now()

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self.indexer_url}/api/v2/{chain}/{network}/smart-contracts/{address}"
            )

            if response.status_code == 200:
                data = response.json()
                return QueryResult(
                    data=[data],
                    total=1,
                    query_type=QueryType.REALTIME,
                    took_ms=(datetime.now() - start).total_seconds() * 1000,
                    chain=chain,
                    network=network,
                )

            return QueryResult(
                data=[],
                total=0,
                query_type=QueryType.REALTIME,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
                chain=chain,
                network=network,
            )

    # =========================================================================
    # Logs/Events Queries
    # =========================================================================

    async def get_logs(
        self,
        chain: str,
        network: str,
        address: str | None = None,
        topics: list[str] | None = None,
        from_block: int | None = None,
        to_block: int | None = None,
        limit: int = 100,
    ) -> QueryResult:
        """Get event logs with filters."""
        start = datetime.now()

        params: dict[str, Any] = {"limit": limit}
        if address:
            params["address"] = address
        if topics:
            params["topics"] = ",".join(topics)
        if from_block:
            params["from_block"] = from_block
        if to_block:
            params["to_block"] = to_block

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self.indexer_url}/api/v2/{chain}/{network}/logs",
                params=params,
            )

            if response.status_code == 200:
                data = response.json()
                return QueryResult(
                    data=data.get("items", []),
                    total=data.get("total", 0),
                    query_type=QueryType.REALTIME,
                    took_ms=(datetime.now() - start).total_seconds() * 1000,
                    chain=chain,
                    network=network,
                )

            return QueryResult(
                data=[],
                total=0,
                query_type=QueryType.REALTIME,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
                chain=chain,
                network=network,
            )

    # =========================================================================
    # Cross-Chain Queries
    # =========================================================================

    async def get_address_across_chains(
        self,
        address: str,
        chains: list[tuple[str, str]] | None = None,
    ) -> dict[str, QueryResult]:
        """Get address info across multiple chains in parallel."""
        import asyncio

        if chains is None:
            # Default to popular chains
            chains = [
                ("ethereum", "mainnet"),
                ("polygon", "mainnet"),
                ("arbitrum", "mainnet"),
                ("optimism", "mainnet"),
                ("base", "mainnet"),
                ("avalanche", "mainnet"),
                ("bsc", "mainnet"),
            ]

        async def fetch_chain(chain: str, network: str) -> tuple[str, QueryResult]:
            result = await self.get_address(chain, network, address)
            return f"{chain}:{network}", result

        tasks = [fetch_chain(chain, network) for chain, network in chains]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        return {
            key: result
            for key, result in results
            if not isinstance(result, Exception) and result.total > 0
        }

    # =========================================================================
    # Stats Queries
    # =========================================================================

    async def get_chain_stats(
        self,
        chain: str,
        network: str,
    ) -> QueryResult:
        """Get chain statistics (block height, tx count, etc)."""
        start = datetime.now()

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self.indexer_url}/api/v2/{chain}/{network}/stats"
            )

            if response.status_code == 200:
                data = response.json()
                return QueryResult(
                    data=[data],
                    total=1,
                    query_type=QueryType.REALTIME,
                    took_ms=(datetime.now() - start).total_seconds() * 1000,
                    chain=chain,
                    network=network,
                )

            return QueryResult(
                data=[],
                total=0,
                query_type=QueryType.REALTIME,
                took_ms=(datetime.now() - start).total_seconds() * 1000,
                chain=chain,
                network=network,
            )


# Global client instance
_query_client: UnifiedQueryClient | None = None


def get_query_client() -> UnifiedQueryClient:
    """Get unified query client singleton."""
    global _query_client
    if _query_client is None:
        _query_client = UnifiedQueryClient()
    return _query_client
