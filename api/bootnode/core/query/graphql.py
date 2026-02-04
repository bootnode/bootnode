"""GraphQL API for Omnichain Queries.

Provides a unified GraphQL interface for:
- Blocks, transactions, addresses across 100+ chains
- Full-text search via Meilisearch
- Vector/semantic search via Qdrant
- Analytics via ClickHouse
- Real-time subscriptions via WebSocket
"""

from datetime import datetime
from typing import Any

import strawberry
from strawberry.types import Info

from bootnode.core.query.unified import get_query_client, QueryResult
from bootnode.core.query.search import get_search_engine, SearchResponse
from bootnode.core.query.vector import get_vector_store, VectorSearchResponse
from bootnode.core.query.analytics import get_analytics_engine, TimeSeriesData


# =============================================================================
# GraphQL Types
# =============================================================================


@strawberry.type
class Block:
    """Blockchain block."""
    hash: str
    number: int
    timestamp: datetime
    parent_hash: str
    transactions_count: int
    gas_used: int
    gas_limit: int
    base_fee_per_gas: int | None
    miner: str
    chain: str
    network: str


@strawberry.type
class Transaction:
    """Blockchain transaction."""
    hash: str
    block_number: int
    block_hash: str
    from_address: str
    to_address: str | None
    value: str
    gas: int
    gas_price: str
    gas_used: int | None
    nonce: int
    input: str
    status: int | None
    timestamp: datetime
    chain: str
    network: str


@strawberry.type
class Address:
    """Blockchain address with balance and activity."""
    address: str
    balance: str
    tx_count: int
    is_contract: bool
    token_count: int
    chain: str
    network: str


@strawberry.type
class Token:
    """ERC20/721/1155 token."""
    address: str
    name: str
    symbol: str
    decimals: int
    total_supply: str
    token_type: str
    holders: int
    chain: str
    network: str


@strawberry.type
class Contract:
    """Verified smart contract."""
    address: str
    name: str | None
    compiler: str | None
    optimization: bool
    verified: bool
    source_code: str | None
    abi: str | None
    chain: str
    network: str


@strawberry.type
class SearchHit:
    """Search result hit."""
    id: str
    type: str
    data: strawberry.scalars.JSON
    score: float | None


@strawberry.type
class SearchResults:
    """Search results."""
    hits: list[SearchHit]
    total: int
    query: str
    took_ms: float


@strawberry.type
class VectorSearchHit:
    """Vector search result."""
    id: str
    score: float
    data: strawberry.scalars.JSON


@strawberry.type
class VectorResults:
    """Vector search results."""
    hits: list[VectorSearchHit]
    total: int
    took_ms: float


@strawberry.type
class TimeSeriesPoint:
    """Time series data point."""
    timestamp: datetime
    value: float
    metadata: strawberry.scalars.JSON | None


@strawberry.type
class TimeSeries:
    """Time series data."""
    points: list[TimeSeriesPoint]
    metric: str
    interval: str
    chain: str
    network: str


@strawberry.type
class ChainStats:
    """Chain statistics."""
    chain: str
    network: str
    block_height: int
    tx_count_24h: int
    unique_addresses_24h: int
    avg_block_time: float
    avg_gas_price: str


@strawberry.type
class PaginatedBlocks:
    """Paginated blocks response."""
    items: list[Block]
    total: int
    cursor: str | None


@strawberry.type
class PaginatedTransactions:
    """Paginated transactions response."""
    items: list[Transaction]
    total: int
    cursor: str | None


@strawberry.type
class PaginatedTokens:
    """Paginated tokens response."""
    items: list[Token]
    total: int
    cursor: str | None


# =============================================================================
# Resolvers
# =============================================================================


def _result_to_block(data: dict, chain: str, network: str) -> Block:
    """Convert query result to Block type."""
    return Block(
        hash=data.get("hash", ""),
        number=data.get("number", 0),
        timestamp=data.get("timestamp", datetime.now()),
        parent_hash=data.get("parent_hash", ""),
        transactions_count=data.get("transactions_count", 0),
        gas_used=data.get("gas_used", 0),
        gas_limit=data.get("gas_limit", 0),
        base_fee_per_gas=data.get("base_fee_per_gas"),
        miner=data.get("miner", ""),
        chain=chain,
        network=network,
    )


def _result_to_transaction(data: dict, chain: str, network: str) -> Transaction:
    """Convert query result to Transaction type."""
    return Transaction(
        hash=data.get("hash", ""),
        block_number=data.get("block_number", 0),
        block_hash=data.get("block_hash", ""),
        from_address=data.get("from", ""),
        to_address=data.get("to"),
        value=str(data.get("value", "0")),
        gas=data.get("gas", 0),
        gas_price=str(data.get("gas_price", "0")),
        gas_used=data.get("gas_used"),
        nonce=data.get("nonce", 0),
        input=data.get("input", "0x"),
        status=data.get("status"),
        timestamp=data.get("timestamp", datetime.now()),
        chain=chain,
        network=network,
    )


def _result_to_token(data: dict, chain: str, network: str) -> Token:
    """Convert query result to Token type."""
    return Token(
        address=data.get("address", ""),
        name=data.get("name", ""),
        symbol=data.get("symbol", ""),
        decimals=data.get("decimals", 18),
        total_supply=str(data.get("total_supply", "0")),
        token_type=data.get("type", "ERC20"),
        holders=data.get("holders", 0),
        chain=chain,
        network=network,
    )


# =============================================================================
# Query Type
# =============================================================================


@strawberry.type
class Query:
    """Root query type for omnichain data."""

    # =========================================================================
    # Block Queries
    # =========================================================================

    @strawberry.field
    async def block(
        self,
        chain: str,
        network: str,
        number: int | None = None,
        hash: str | None = None,
    ) -> Block | None:
        """Get a block by number or hash."""
        client = get_query_client()

        identifier = hash if hash else number
        if identifier is None:
            return None

        result = await client.get_block(chain, network, identifier)
        if result.data:
            return _result_to_block(result.data[0], chain, network)
        return None

    @strawberry.field
    async def blocks(
        self,
        chain: str,
        network: str,
        limit: int = 20,
        cursor: str | None = None,
    ) -> PaginatedBlocks:
        """Get recent blocks with pagination."""
        client = get_query_client()
        result = await client.get_blocks(chain, network, limit, cursor)

        return PaginatedBlocks(
            items=[_result_to_block(b, chain, network) for b in result.data],
            total=result.total,
            cursor=result.cursor,
        )

    # =========================================================================
    # Transaction Queries
    # =========================================================================

    @strawberry.field
    async def transaction(
        self,
        chain: str,
        network: str,
        hash: str,
    ) -> Transaction | None:
        """Get a transaction by hash."""
        client = get_query_client()
        result = await client.get_transaction(chain, network, hash)

        if result.data:
            return _result_to_transaction(result.data[0], chain, network)
        return None

    @strawberry.field
    async def transactions(
        self,
        chain: str,
        network: str,
        address: str | None = None,
        block_number: int | None = None,
        limit: int = 20,
        cursor: str | None = None,
    ) -> PaginatedTransactions:
        """Get transactions with optional filters."""
        client = get_query_client()
        result = await client.get_transactions(
            chain, network, address, block_number, limit, cursor
        )

        return PaginatedTransactions(
            items=[_result_to_transaction(t, chain, network) for t in result.data],
            total=result.total,
            cursor=result.cursor,
        )

    # =========================================================================
    # Address Queries
    # =========================================================================

    @strawberry.field
    async def address(
        self,
        chain: str,
        network: str,
        address: str,
    ) -> Address | None:
        """Get address details."""
        client = get_query_client()
        result = await client.get_address(chain, network, address)

        if result.data:
            data = result.data[0]
            return Address(
                address=data.get("address", address),
                balance=str(data.get("balance", "0")),
                tx_count=data.get("tx_count", 0),
                is_contract=data.get("is_contract", False),
                token_count=data.get("token_count", 0),
                chain=chain,
                network=network,
            )
        return None

    @strawberry.field
    async def address_across_chains(
        self,
        address: str,
        chains: list[str] | None = None,
    ) -> list[Address]:
        """Get address info across multiple chains."""
        client = get_query_client()

        # Parse chains input (format: "chain:network")
        chain_list = None
        if chains:
            chain_list = [
                tuple(c.split(":")) if ":" in c else (c, "mainnet")
                for c in chains
            ]

        results = await client.get_address_across_chains(address, chain_list)

        addresses = []
        for key, result in results.items():
            if result.data:
                chain, network = key.split(":")
                data = result.data[0]
                addresses.append(Address(
                    address=data.get("address", address),
                    balance=str(data.get("balance", "0")),
                    tx_count=data.get("tx_count", 0),
                    is_contract=data.get("is_contract", False),
                    token_count=data.get("token_count", 0),
                    chain=chain,
                    network=network,
                ))

        return addresses

    # =========================================================================
    # Token Queries
    # =========================================================================

    @strawberry.field
    async def token(
        self,
        chain: str,
        network: str,
        address: str,
    ) -> Token | None:
        """Get token details."""
        client = get_query_client()
        result = await client.get_token(chain, network, address)

        if result.data:
            return _result_to_token(result.data[0], chain, network)
        return None

    @strawberry.field
    async def tokens(
        self,
        chain: str,
        network: str,
        query: str | None = None,
        limit: int = 50,
        cursor: str | None = None,
    ) -> PaginatedTokens:
        """Get tokens with optional search."""
        client = get_query_client()
        result = await client.get_tokens(chain, network, query, limit, cursor)

        return PaginatedTokens(
            items=[_result_to_token(t, chain, network) for t in result.data],
            total=result.total,
            cursor=result.cursor,
        )

    # =========================================================================
    # Search (Meilisearch)
    # =========================================================================

    @strawberry.field
    async def search(
        self,
        query: str,
        chain: str | None = None,
        network: str | None = None,
        types: list[str] | None = None,
        limit: int = 20,
    ) -> SearchResults:
        """Full-text search across addresses, tokens, contracts, transactions."""
        engine = get_search_engine()

        # If types specified, search only those
        if types:
            all_hits = []
            total = 0
            took = 0.0

            for t in types:
                if t == "addresses":
                    r = await engine.search_addresses(query, chain, network, limit=limit)
                elif t == "tokens":
                    r = await engine.search_tokens(query, chain, network, limit=limit)
                elif t == "contracts":
                    r = await engine.search_contracts(query, chain, network, limit=limit)
                elif t == "transactions":
                    r = await engine.search_transactions(query, chain, network, limit=limit)
                else:
                    continue

                all_hits.extend([
                    SearchHit(id=h.id, type=t, data=h.data, score=h.score)
                    for h in r.hits
                ])
                total += r.total
                took = max(took, r.took_ms)

            return SearchResults(hits=all_hits, total=total, query=query, took_ms=took)

        # Search all types
        results = await engine.search_all(query, chain, network, limit_per_type=limit // 4)

        all_hits = []
        total = 0
        took = 0.0

        for index, response in results.items():
            all_hits.extend([
                SearchHit(id=h.id, type=index, data=h.data, score=h.score)
                for h in response.hits
            ])
            total += response.total
            took = max(took, response.took_ms)

        return SearchResults(hits=all_hits, total=total, query=query, took_ms=took)

    # =========================================================================
    # Vector Search (Qdrant)
    # =========================================================================

    @strawberry.field
    async def similar_contracts(
        self,
        chain: str,
        network: str,
        address: str,
        limit: int = 10,
    ) -> VectorResults:
        """Find contracts similar to a given contract."""
        store = get_vector_store()
        result = await store.find_similar_contracts(address, chain, network, limit)

        return VectorResults(
            hits=[
                VectorSearchHit(id=r.id, score=r.score, data=r.payload)
                for r in result.results
            ],
            total=result.total,
            took_ms=result.took_ms,
        )

    @strawberry.field
    async def semantic_search(
        self,
        query: str,
        collection: str = "contracts",
        chain: str | None = None,
        limit: int = 10,
    ) -> VectorResults:
        """Semantic search using embeddings."""
        store = get_vector_store()

        # Generate embedding for query
        embedding = await store.generate_embedding(query)

        # Build filter
        filter_dict = None
        if chain:
            filter_dict = {"must": [{"key": "chain", "match": {"value": chain}}]}

        result = await store.search(collection, embedding, limit=limit, filter=filter_dict)

        return VectorResults(
            hits=[
                VectorSearchHit(id=r.id, score=r.score, data=r.payload)
                for r in result.results
            ],
            total=result.total,
            took_ms=result.took_ms,
        )

    # =========================================================================
    # Analytics (ClickHouse)
    # =========================================================================

    @strawberry.field
    async def chain_stats(
        self,
        chain: str,
        network: str,
    ) -> ChainStats | None:
        """Get chain statistics."""
        client = get_query_client()
        result = await client.get_chain_stats(chain, network)

        if result.data:
            data = result.data[0]
            return ChainStats(
                chain=chain,
                network=network,
                block_height=data.get("block_height", 0),
                tx_count_24h=data.get("tx_count_24h", 0),
                unique_addresses_24h=data.get("unique_addresses_24h", 0),
                avg_block_time=data.get("avg_block_time", 0.0),
                avg_gas_price=str(data.get("avg_gas_price", "0")),
            )
        return None

    @strawberry.field
    async def gas_price_history(
        self,
        chain: str,
        network: str,
        hours: int = 24,
    ) -> TimeSeries:
        """Get gas price history."""
        analytics = get_analytics_engine()
        result = await analytics.get_gas_price_history(chain, network, hours)

        return TimeSeries(
            points=[
                TimeSeriesPoint(
                    timestamp=p.timestamp,
                    value=p.value,
                    metadata=p.metadata,
                )
                for p in result.points
            ],
            metric=result.metric,
            interval=result.interval,
            chain=chain,
            network=network,
        )

    @strawberry.field
    async def transaction_volume(
        self,
        chain: str,
        network: str,
        days: int = 30,
        interval: str = "1d",
    ) -> TimeSeries:
        """Get transaction volume history."""
        analytics = get_analytics_engine()
        result = await analytics.get_transaction_volume(chain, network, days, interval)

        return TimeSeries(
            points=[
                TimeSeriesPoint(
                    timestamp=p.timestamp,
                    value=p.value,
                    metadata=p.metadata,
                )
                for p in result.points
            ],
            metric=result.metric,
            interval=result.interval,
            chain=chain,
            network=network,
        )

    @strawberry.field
    async def defi_tvl(
        self,
        chain: str,
        network: str,
        protocol: str | None = None,
        days: int = 30,
    ) -> TimeSeries:
        """Get DeFi TVL history."""
        analytics = get_analytics_engine()
        result = await analytics.get_defi_tvl(chain, network, protocol, days)

        return TimeSeries(
            points=[
                TimeSeriesPoint(
                    timestamp=p.timestamp,
                    value=p.value,
                    metadata=p.metadata,
                )
                for p in result.points
            ],
            metric=result.metric,
            interval=result.interval,
            chain=chain,
            network=network,
        )


# =============================================================================
# Subscription Type (for real-time updates)
# =============================================================================


@strawberry.type
class Subscription:
    """Real-time subscriptions via WebSocket."""

    @strawberry.subscription
    async def new_blocks(
        self,
        chain: str,
        network: str,
    ) -> Block:
        """Subscribe to new blocks."""
        # This would connect to the indexer's WebSocket
        # For now, return a placeholder
        import asyncio
        while True:
            await asyncio.sleep(12)  # ~1 block on Ethereum
            yield Block(
                hash="0x...",
                number=0,
                timestamp=datetime.now(),
                parent_hash="0x...",
                transactions_count=0,
                gas_used=0,
                gas_limit=0,
                base_fee_per_gas=None,
                miner="0x...",
                chain=chain,
                network=network,
            )

    @strawberry.subscription
    async def new_transactions(
        self,
        chain: str,
        network: str,
        address: str | None = None,
    ) -> Transaction:
        """Subscribe to new transactions."""
        import asyncio
        while True:
            await asyncio.sleep(1)
            yield Transaction(
                hash="0x...",
                block_number=0,
                block_hash="0x...",
                from_address="0x...",
                to_address="0x...",
                value="0",
                gas=0,
                gas_price="0",
                gas_used=0,
                nonce=0,
                input="0x",
                status=1,
                timestamp=datetime.now(),
                chain=chain,
                network=network,
            )


# =============================================================================
# Schema
# =============================================================================


schema = strawberry.Schema(
    query=Query,
    subscription=Subscription,
)


def get_graphql_app():
    """Get GraphQL ASGI app for FastAPI integration."""
    from strawberry.fastapi import GraphQLRouter

    return GraphQLRouter(schema, path="/graphql")
