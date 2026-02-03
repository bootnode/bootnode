# Hanzo Nodes API

Multi-chain blockchain infrastructure platform providing RPC, APIs, WebSockets, Webhooks, and ERC-4337 bundling.

## Features

- **Multi-Chain RPC**: 100+ EVM chains with load balancing
- **Token API**: ERC-20 balances, transfers, prices
- **NFT API**: ERC-721/1155 ownership, metadata, transfers
- **Wallet API**: Portfolio tracking, activity history
- **WebSocket Subscriptions**: Real-time blockchain events
- **Webhooks**: Event notifications with delivery tracking
- **ERC-4337 Bundler**: Account abstraction with gasless transactions
- **Gas API**: Real-time gas estimates and EIP-1559 data

## Quick Start

```bash
# Start dependencies
docker compose up -d postgres redis clickhouse

# Run API locally
uv run uvicorn bootnode.main:app --reload

# Or with Docker
docker compose up -d
```

## API Endpoints

- `GET /health` - Health check
- `POST /v1/rpc/{chain}/{network}` - JSON-RPC proxy
- `GET /v1/tokens/{chain}/balance/{address}` - Token balances
- `GET /v1/nfts/{chain}/owner/{address}` - NFT ownership
- `POST /v1/webhooks` - Create webhook
- `WS /v1/ws/{chain}/{network}` - WebSocket subscriptions

## Environment Variables

```bash
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
DATASTORE_URL=clickhouse://...
JWT_SECRET=...
```

## Documentation

- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

BSD-3-Clause
