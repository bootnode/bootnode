"""Vector Search with Qdrant - Semantic search across blockchain data.

Use cases:
- Find similar contracts by bytecode/ABI
- Semantic search for transactions by description
- Find addresses with similar activity patterns
- Search for tokens by description/use case
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import uuid4

import httpx
import structlog

from bootnode.config import get_settings

logger = structlog.get_logger()


@dataclass
class VectorSearchResult:
    """Vector search result with similarity score."""
    id: str
    score: float
    payload: dict
    vector: list[float] | None = None


@dataclass
class VectorSearchResponse:
    """Vector search response."""
    results: list[VectorSearchResult]
    took_ms: float
    total: int


class VectorStore:
    """Qdrant vector store for semantic search."""

    # Collection names
    CONTRACTS = "contracts"
    TRANSACTIONS = "transactions"
    TOKENS = "tokens"
    ADDRESSES = "addresses"

    def __init__(self) -> None:
        settings = get_settings()
        self.qdrant_url = getattr(settings, "qdrant_url", "http://localhost:6333")
        self.qdrant_api_key = getattr(settings, "qdrant_api_key", None)
        self._timeout = httpx.Timeout(30.0)

    def _headers(self) -> dict[str, str]:
        """Get request headers."""
        headers = {"Content-Type": "application/json"}
        if self.qdrant_api_key:
            headers["api-key"] = self.qdrant_api_key
        return headers

    # =========================================================================
    # Collection Management
    # =========================================================================

    async def create_collection(
        self,
        name: str,
        vector_size: int = 1536,  # OpenAI embedding size
        distance: str = "Cosine",
    ) -> bool:
        """Create a vector collection."""
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.put(
                f"{self.qdrant_url}/collections/{name}",
                json={
                    "vectors": {
                        "size": vector_size,
                        "distance": distance,
                    },
                    "optimizers_config": {
                        "indexing_threshold": 10000,
                    },
                },
                headers=self._headers(),
            )

            if response.status_code in (200, 201):
                logger.info("Created vector collection", name=name)
                return True

            logger.warning(
                "Failed to create collection",
                name=name,
                status=response.status_code,
            )
            return False

    async def ensure_collections(self) -> None:
        """Ensure all required collections exist."""
        collections = [
            (self.CONTRACTS, 1536),
            (self.TRANSACTIONS, 768),
            (self.TOKENS, 768),
            (self.ADDRESSES, 512),
        ]

        for name, size in collections:
            await self.create_collection(name, size)

    # =========================================================================
    # Indexing
    # =========================================================================

    async def upsert(
        self,
        collection: str,
        id: str,
        vector: list[float],
        payload: dict,
    ) -> bool:
        """Upsert a vector with payload."""
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.put(
                f"{self.qdrant_url}/collections/{collection}/points",
                json={
                    "points": [
                        {
                            "id": id,
                            "vector": vector,
                            "payload": payload,
                        }
                    ]
                },
                headers=self._headers(),
            )

            return response.status_code in (200, 201)

    async def upsert_batch(
        self,
        collection: str,
        points: list[dict],
    ) -> bool:
        """Upsert multiple vectors."""
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.put(
                f"{self.qdrant_url}/collections/{collection}/points",
                json={"points": points},
                headers=self._headers(),
            )

            return response.status_code in (200, 201)

    # =========================================================================
    # Search
    # =========================================================================

    async def search(
        self,
        collection: str,
        query_vector: list[float],
        limit: int = 10,
        filter: dict | None = None,
        with_payload: bool = True,
        with_vectors: bool = False,
    ) -> VectorSearchResponse:
        """Search for similar vectors."""
        start = datetime.now()

        body: dict[str, Any] = {
            "vector": query_vector,
            "limit": limit,
            "with_payload": with_payload,
            "with_vectors": with_vectors,
        }

        if filter:
            body["filter"] = filter

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self.qdrant_url}/collections/{collection}/points/search",
                json=body,
                headers=self._headers(),
            )

            took_ms = (datetime.now() - start).total_seconds() * 1000

            if response.status_code == 200:
                data = response.json()
                results = [
                    VectorSearchResult(
                        id=str(r["id"]),
                        score=r["score"],
                        payload=r.get("payload", {}),
                        vector=r.get("vector"),
                    )
                    for r in data.get("result", [])
                ]

                return VectorSearchResponse(
                    results=results,
                    took_ms=took_ms,
                    total=len(results),
                )

            return VectorSearchResponse(
                results=[],
                took_ms=took_ms,
                total=0,
            )

    async def search_contracts(
        self,
        query_vector: list[float],
        chain: str | None = None,
        network: str | None = None,
        limit: int = 10,
    ) -> VectorSearchResponse:
        """Search for similar contracts."""
        filter = None
        if chain or network:
            must = []
            if chain:
                must.append({"key": "chain", "match": {"value": chain}})
            if network:
                must.append({"key": "network", "match": {"value": network}})
            filter = {"must": must}

        return await self.search(
            self.CONTRACTS,
            query_vector,
            limit=limit,
            filter=filter,
        )

    async def search_tokens(
        self,
        query_vector: list[float],
        chain: str | None = None,
        token_type: str | None = None,
        limit: int = 10,
    ) -> VectorSearchResponse:
        """Search for similar tokens."""
        filter = None
        must = []
        if chain:
            must.append({"key": "chain", "match": {"value": chain}})
        if token_type:
            must.append({"key": "type", "match": {"value": token_type}})
        if must:
            filter = {"must": must}

        return await self.search(
            self.TOKENS,
            query_vector,
            limit=limit,
            filter=filter,
        )

    # =========================================================================
    # Contract Similarity
    # =========================================================================

    async def find_similar_contracts(
        self,
        contract_address: str,
        chain: str,
        network: str,
        limit: int = 10,
    ) -> VectorSearchResponse:
        """Find contracts similar to a given contract.

        Uses the stored embedding of the contract's bytecode/ABI.
        """
        # First, get the contract's vector
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self.qdrant_url}/collections/{self.CONTRACTS}/points/scroll",
                json={
                    "filter": {
                        "must": [
                            {"key": "address", "match": {"value": contract_address.lower()}},
                            {"key": "chain", "match": {"value": chain}},
                            {"key": "network", "match": {"value": network}},
                        ]
                    },
                    "limit": 1,
                    "with_vectors": True,
                },
                headers=self._headers(),
            )

            if response.status_code != 200:
                return VectorSearchResponse(results=[], took_ms=0, total=0)

            data = response.json()
            points = data.get("result", {}).get("points", [])
            if not points:
                return VectorSearchResponse(results=[], took_ms=0, total=0)

            vector = points[0].get("vector", [])

        # Search for similar, excluding the original
        return await self.search(
            self.CONTRACTS,
            vector,
            limit=limit + 1,  # Get extra to filter out self
            filter={
                "must_not": [
                    {"key": "address", "match": {"value": contract_address.lower()}}
                ]
            },
        )

    # =========================================================================
    # Embedding Generation (placeholder - integrate with embedding service)
    # =========================================================================

    async def generate_embedding(
        self,
        text: str,
        model: str = "text-embedding-3-small",
    ) -> list[float]:
        """Generate embedding for text.

        In production, this should call OpenAI or a local embedding model.
        For now, returns a placeholder.
        """
        # TODO: Integrate with embedding service
        # This is a placeholder that returns a random-ish vector
        import hashlib
        hash_bytes = hashlib.sha256(text.encode()).digest()
        # Create a 768-dim vector from hash (for demo)
        vector = []
        for i in range(768):
            byte_idx = i % 32
            vector.append((hash_bytes[byte_idx] - 128) / 128.0)
        return vector


# Global instance
_vector_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    """Get vector store singleton."""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
