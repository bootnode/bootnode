"""Full-Text Search with Meilisearch - Fast search across blockchain data.

Indexes:
- addresses: Wallet addresses with labels, ENS names
- tokens: Token names, symbols, descriptions
- contracts: Verified contract names, functions
- transactions: Transaction hashes, methods
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any

import httpx
import structlog

from bootnode.config import get_settings

logger = structlog.get_logger()


@dataclass
class SearchHit:
    """Search hit with relevance ranking."""
    id: str
    data: dict
    score: float | None = None
    highlights: dict | None = None


@dataclass
class SearchResponse:
    """Search response with facets and stats."""
    hits: list[SearchHit]
    query: str
    total: int
    took_ms: float
    facets: dict | None = None


class SearchEngine:
    """Meilisearch full-text search engine."""

    # Index names
    ADDRESSES = "addresses"
    TOKENS = "tokens"
    CONTRACTS = "contracts"
    TRANSACTIONS = "transactions"

    def __init__(self) -> None:
        settings = get_settings()
        self.meili_url = getattr(settings, "meilisearch_url", "http://localhost:7700")
        self.meili_key = getattr(settings, "meilisearch_api_key", None)
        self._timeout = httpx.Timeout(30.0)

    def _headers(self) -> dict[str, str]:
        """Get request headers."""
        headers = {"Content-Type": "application/json"}
        if self.meili_key:
            headers["Authorization"] = f"Bearer {self.meili_key}"
        return headers

    # =========================================================================
    # Index Management
    # =========================================================================

    async def create_index(
        self,
        name: str,
        primary_key: str = "id",
    ) -> bool:
        """Create a search index."""
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self.meili_url}/indexes",
                json={
                    "uid": name,
                    "primaryKey": primary_key,
                },
                headers=self._headers(),
            )

            if response.status_code in (200, 201, 202):
                logger.info("Created search index", name=name)
                return True

            logger.warning(
                "Failed to create index",
                name=name,
                status=response.status_code,
            )
            return False

    async def configure_index(
        self,
        name: str,
        searchable_attributes: list[str] | None = None,
        filterable_attributes: list[str] | None = None,
        sortable_attributes: list[str] | None = None,
        ranking_rules: list[str] | None = None,
    ) -> bool:
        """Configure index settings."""
        settings: dict[str, Any] = {}

        if searchable_attributes:
            settings["searchableAttributes"] = searchable_attributes
        if filterable_attributes:
            settings["filterableAttributes"] = filterable_attributes
        if sortable_attributes:
            settings["sortableAttributes"] = sortable_attributes
        if ranking_rules:
            settings["rankingRules"] = ranking_rules

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.patch(
                f"{self.meili_url}/indexes/{name}/settings",
                json=settings,
                headers=self._headers(),
            )

            return response.status_code in (200, 202)

    async def ensure_indexes(self) -> None:
        """Ensure all required indexes exist with proper configuration."""
        # Addresses index
        await self.create_index(self.ADDRESSES)
        await self.configure_index(
            self.ADDRESSES,
            searchable_attributes=["address", "label", "ens", "tags"],
            filterable_attributes=["chain", "network", "type", "verified"],
            sortable_attributes=["balance", "tx_count", "created_at"],
        )

        # Tokens index
        await self.create_index(self.TOKENS)
        await self.configure_index(
            self.TOKENS,
            searchable_attributes=["name", "symbol", "address", "description"],
            filterable_attributes=["chain", "network", "type", "decimals"],
            sortable_attributes=["holders", "market_cap", "volume_24h"],
        )

        # Contracts index
        await self.create_index(self.CONTRACTS)
        await self.configure_index(
            self.CONTRACTS,
            searchable_attributes=["name", "address", "functions", "events", "source"],
            filterable_attributes=["chain", "network", "verified", "compiler"],
            sortable_attributes=["tx_count", "created_at"],
        )

        # Transactions index
        await self.create_index(self.TRANSACTIONS)
        await self.configure_index(
            self.TRANSACTIONS,
            searchable_attributes=["hash", "from", "to", "method", "input_decoded"],
            filterable_attributes=["chain", "network", "status", "block_number"],
            sortable_attributes=["block_number", "gas_used", "value"],
        )

    # =========================================================================
    # Indexing
    # =========================================================================

    async def add_documents(
        self,
        index: str,
        documents: list[dict],
        primary_key: str | None = None,
    ) -> str | None:
        """Add documents to an index."""
        params = {}
        if primary_key:
            params["primaryKey"] = primary_key

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self.meili_url}/indexes/{index}/documents",
                json=documents,
                params=params,
                headers=self._headers(),
            )

            if response.status_code in (200, 202):
                data = response.json()
                return data.get("taskUid")

            logger.warning(
                "Failed to add documents",
                index=index,
                status=response.status_code,
            )
            return None

    async def delete_document(
        self,
        index: str,
        document_id: str,
    ) -> bool:
        """Delete a document from an index."""
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.delete(
                f"{self.meili_url}/indexes/{index}/documents/{document_id}",
                headers=self._headers(),
            )

            return response.status_code in (200, 202)

    # =========================================================================
    # Search
    # =========================================================================

    async def search(
        self,
        index: str,
        query: str,
        limit: int = 20,
        offset: int = 0,
        filter: str | None = None,
        sort: list[str] | None = None,
        facets: list[str] | None = None,
        highlight_fields: list[str] | None = None,
    ) -> SearchResponse:
        """Search an index."""
        start = datetime.now()

        body: dict[str, Any] = {
            "q": query,
            "limit": limit,
            "offset": offset,
        }

        if filter:
            body["filter"] = filter
        if sort:
            body["sort"] = sort
        if facets:
            body["facets"] = facets
        if highlight_fields:
            body["attributesToHighlight"] = highlight_fields
            body["highlightPreTag"] = "<mark>"
            body["highlightPostTag"] = "</mark>"

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self.meili_url}/indexes/{index}/search",
                json=body,
                headers=self._headers(),
            )

            took_ms = (datetime.now() - start).total_seconds() * 1000

            if response.status_code == 200:
                data = response.json()

                hits = [
                    SearchHit(
                        id=hit.get("id", hit.get("address", "")),
                        data=hit,
                        highlights=hit.get("_formatted"),
                    )
                    for hit in data.get("hits", [])
                ]

                return SearchResponse(
                    hits=hits,
                    query=query,
                    total=data.get("estimatedTotalHits", len(hits)),
                    took_ms=data.get("processingTimeMs", took_ms),
                    facets=data.get("facetDistribution"),
                )

            return SearchResponse(
                hits=[],
                query=query,
                total=0,
                took_ms=took_ms,
            )

    # =========================================================================
    # Specialized Searches
    # =========================================================================

    async def search_addresses(
        self,
        query: str,
        chain: str | None = None,
        network: str | None = None,
        address_type: str | None = None,
        limit: int = 20,
    ) -> SearchResponse:
        """Search addresses by label, ENS, or address."""
        filters = []
        if chain:
            filters.append(f'chain = "{chain}"')
        if network:
            filters.append(f'network = "{network}"')
        if address_type:
            filters.append(f'type = "{address_type}"')

        filter_str = " AND ".join(filters) if filters else None

        return await self.search(
            self.ADDRESSES,
            query,
            limit=limit,
            filter=filter_str,
            highlight_fields=["label", "ens", "address"],
        )

    async def search_tokens(
        self,
        query: str,
        chain: str | None = None,
        network: str | None = None,
        token_type: str | None = None,
        limit: int = 20,
    ) -> SearchResponse:
        """Search tokens by name, symbol, or address."""
        filters = []
        if chain:
            filters.append(f'chain = "{chain}"')
        if network:
            filters.append(f'network = "{network}"')
        if token_type:
            filters.append(f'type = "{token_type}"')

        filter_str = " AND ".join(filters) if filters else None

        return await self.search(
            self.TOKENS,
            query,
            limit=limit,
            filter=filter_str,
            sort=["holders:desc"],
            facets=["chain", "type"],
            highlight_fields=["name", "symbol", "description"],
        )

    async def search_contracts(
        self,
        query: str,
        chain: str | None = None,
        network: str | None = None,
        verified_only: bool = False,
        limit: int = 20,
    ) -> SearchResponse:
        """Search contracts by name, function, or address."""
        filters = []
        if chain:
            filters.append(f'chain = "{chain}"')
        if network:
            filters.append(f'network = "{network}"')
        if verified_only:
            filters.append("verified = true")

        filter_str = " AND ".join(filters) if filters else None

        return await self.search(
            self.CONTRACTS,
            query,
            limit=limit,
            filter=filter_str,
            facets=["chain", "verified", "compiler"],
            highlight_fields=["name", "functions", "events"],
        )

    async def search_transactions(
        self,
        query: str,
        chain: str | None = None,
        network: str | None = None,
        status: str | None = None,
        limit: int = 20,
    ) -> SearchResponse:
        """Search transactions by hash, method, or address."""
        filters = []
        if chain:
            filters.append(f'chain = "{chain}"')
        if network:
            filters.append(f'network = "{network}"')
        if status:
            filters.append(f'status = "{status}"')

        filter_str = " AND ".join(filters) if filters else None

        return await self.search(
            self.TRANSACTIONS,
            query,
            limit=limit,
            filter=filter_str,
            sort=["block_number:desc"],
            highlight_fields=["hash", "method", "input_decoded"],
        )

    # =========================================================================
    # Global Search
    # =========================================================================

    async def search_all(
        self,
        query: str,
        chain: str | None = None,
        network: str | None = None,
        limit_per_type: int = 5,
    ) -> dict[str, SearchResponse]:
        """Search across all indexes in parallel."""
        import asyncio

        async def search_index(index: str, search_fn) -> tuple[str, SearchResponse]:
            result = await search_fn(
                query,
                chain=chain,
                network=network,
                limit=limit_per_type,
            )
            return index, result

        tasks = [
            search_index(self.ADDRESSES, self.search_addresses),
            search_index(self.TOKENS, self.search_tokens),
            search_index(self.CONTRACTS, self.search_contracts),
            search_index(self.TRANSACTIONS, self.search_transactions),
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        return {
            index: result
            for index, result in results
            if not isinstance(result, Exception)
        }


# Global instance
_search_engine: SearchEngine | None = None


def get_search_engine() -> SearchEngine:
    """Get search engine singleton."""
    global _search_engine
    if _search_engine is None:
        _search_engine = SearchEngine()
    return _search_engine
