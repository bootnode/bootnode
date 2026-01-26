# Bootnode API

Blockchain Development Platform - Multi-chain RPC, Token API, NFT API, Smart Wallets, and more.

## Features

- **RPC API**: JSON-RPC proxy with load balancing for 10+ chains
- **Token API**: ERC-20/ERC-721/ERC-1155 balances and metadata
- **NFT API**: NFT collections, ownership, and metadata
- **Transfers API**: Transaction history and token transfers
- **Webhooks**: Event-driven notifications
- **WebSockets**: Real-time blockchain subscriptions
- **Smart Wallets**: ERC-4337 account abstraction
- **Bundler API**: UserOperation bundling
- **Gas Manager**: Gas prices and sponsorship policies

## Supported Chains

| Chain | Mainnet | Testnet |
|-------|---------|---------|
| Ethereum | mainnet | sepolia, holesky |
| Polygon | mainnet | amoy |
| Arbitrum | mainnet | sepolia |
| Optimism | mainnet | sepolia |
| Base | mainnet | sepolia |
| Avalanche | mainnet | fuji |
| BNB Chain | mainnet | testnet |
| Lux | mainnet | testnet |
| Solana | mainnet | devnet |

## Quick Start

### Prerequisites

- Python 3.12+
- PostgreSQL 14+
- Redis 7+

### Development Setup

```bash
# Create virtual environment with uv
uv venv
source .venv/bin/activate

# Install dependencies
uv pip install -e ".[dev]"

# Copy environment file
cp .env.example .env
# Edit .env with your RPC endpoints

# Start services (PostgreSQL, Redis)
cd ../infra
docker compose up -d postgres redis

# Run migrations
cd ../api
alembic upgrade head

# Start the API
uvicorn bootnode.main:app --reload
```

### Using Docker Compose

```bash
cd ../infra
docker compose up -d
```

The API will be available at http://localhost:8000

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Examples

### Create Project & API Key

```bash
# Create project
curl -X POST http://localhost:8000/v1/auth/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project", "owner_id": "00000000-0000-0000-0000-000000000001"}'

# Create API key
curl -X POST http://localhost:8000/v1/auth/keys \
  -H "Content-Type: application/json" \
  -d '{"project_id": "<project_id>", "name": "Production Key"}'
```

### RPC Calls

```bash
# Get block number
curl -X POST http://localhost:8000/v1/rpc/ethereum/mainnet \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bn_your_api_key" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Get balance
curl -X POST http://localhost:8000/v1/rpc/ethereum/mainnet \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bn_your_api_key" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x...", "latest"],"id":1}'
```

### Token API

```bash
# Get token balances
curl "http://localhost:8000/v1/tokens/ethereum/balances/0x...?token_addresses=0x...&network=mainnet" \
  -H "X-API-Key: bn_your_api_key"

# Get token metadata
curl "http://localhost:8000/v1/tokens/ethereum/metadata/0x...?network=mainnet" \
  -H "X-API-Key: bn_your_api_key"
```

### Webhooks

```bash
# Create webhook
curl -X POST http://localhost:8000/v1/webhooks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bn_your_api_key" \
  -d '{
    "name": "NFT Transfers",
    "url": "https://your-app.com/webhook",
    "chain": "ethereum",
    "network": "mainnet",
    "event_type": "NFT_ACTIVITY",
    "filters": {"address": "0x..."}
  }'
```

### WebSocket Subscriptions

```javascript
const ws = new WebSocket('ws://localhost:8000/v1/ws/ethereum/mainnet?api_key=bn_your_key');

ws.onopen = () => {
  // Subscribe to new blocks
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_subscribe',
    params: ['newHeads'],
    id: 1
  }));
};

ws.onmessage = (event) => {
  console.log(JSON.parse(event.data));
};
```

## Configuration

See `.env.example` for all configuration options.

Key settings:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `ETH_MAINNET_RPC`, etc.: Upstream RPC endpoints
- `JWT_SECRET`: Secret for JWT tokens
- `API_KEY_SALT`: Salt for API key hashing

## Development

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=bootnode

# Run linter
ruff check .

# Run type checker
mypy bootnode
```

## License

BSD-3-Clause
