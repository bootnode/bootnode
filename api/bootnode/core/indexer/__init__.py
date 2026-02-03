"""
Event Indexer Module

Real-time blockchain event indexing system for:
- ERC-20 Transfer events
- ERC-721 Transfer events  
- ERC-1155 TransferSingle/TransferBatch events
- Custom contract events for webhooks

Architecture:
- Block listener tracking latest block for each chain
- Event parser decoding logs based on event signatures
- Storage layer for indexed events (Transfers API, NFT ownership)
- Webhook trigger system matching events against filters

For high-performance indexing options:
- Rust-based indexer (see /indexer directory)
- Subgraph-style indexing with TheGraph
- Custom event listener with backfill capability
"""
