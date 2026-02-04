"""Omnichain Query Layer - Unified access to 100+ chains.

Storage Architecture:
┌─────────────────────────────────────────────────────────────────────────┐
│                         Query Layer                                      │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┤
│ PostgreSQL  │ ClickHouse  │   Qdrant    │ Meilisearch │    GraphQL      │
│ (Metadata)  │ (Analytics) │  (Vector)   │ (Full-Text) │     (API)       │
├─────────────┴─────────────┴─────────────┴─────────────┴─────────────────┤
│                         Lux Indexer                                      │
│                   (100+ chains indexed)                                  │
└─────────────────────────────────────────────────────────────────────────┘

Components:
- PostgreSQL: Relational metadata, user data, subscriptions
- ClickHouse: Time-series analytics, usage tracking, chain metrics
- Qdrant: Vector search for semantic queries (contracts, transactions)
- Meilisearch: Full-text search for addresses, tokens, contracts
- GraphQL: Unified API for all query types
"""

from bootnode.core.query.unified import (
    UnifiedQueryClient,
    QueryResult,
    SearchResult,
    get_query_client,
)
from bootnode.core.query.vector import (
    VectorStore,
    get_vector_store,
)
from bootnode.core.query.search import (
    SearchEngine,
    get_search_engine,
)
from bootnode.core.query.analytics import (
    AnalyticsEngine,
    get_analytics_engine,
)

__all__ = [
    "UnifiedQueryClient",
    "QueryResult",
    "SearchResult",
    "get_query_client",
    "VectorStore",
    "get_vector_store",
    "SearchEngine",
    "get_search_engine",
    "AnalyticsEngine",
    "get_analytics_engine",
]
