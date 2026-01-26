# Bootnode - Blockchain Development Platform

## Project Overview

**Bootnode** is a blockchain development platform providing infrastructure APIs for building Web3 applications. The platform enables developers to interact with multiple blockchains through unified APIs - similar to Alchemy, Infura, or QuickNode but with Hanzo AI's focus on developer experience.

## Current State Analysis

### Legacy Architecture (2018-2019 era)
```
bootnode/
├── bootnode/          # Python backend (Quart framework)
│   ├── bootnode.py    # Core orchestration logic
│   ├── kubernetes.py  # K8s deployment management
│   ├── gcloud.py      # GCP integration
│   └── template.py    # Blockchain deployment templates
├── bootnode-admin/    # Next.js 7 admin dashboard
│   ├── pages/         # React pages
│   ├── components/    # UI components (Material UI 3)
│   └── src/           # Client utilities
├── geth/              # Ethereum node Dockerfile
├── casper/            # Casper node Dockerfile
└── config/            # Kubernetes configs
```

### Legacy Tech Stack (Outdated)
- **Backend**: Python 3.7, Quart (async Flask), requests_async
- **Database**: MongoDB (pymongo)
- **Frontend**: Next.js 7, React 16.7, Material UI 3, Stylus
- **Templating**: react-pug (deprecated)
- **Infrastructure**: Google Cloud, Kubernetes
- **Blockchains**: Ethereum (geth), Casper only

### Critical Issues
1. **Security**: Hardcoded credentials in app.py
2. **Dependencies**: All packages severely outdated
3. **Chain Support**: Only 2 blockchains (Ethereum, Casper)
4. **Features**: No modern blockchain APIs (NFT, tokens, AA, etc.)
5. **Frontend**: Ancient Next.js/React versions

## Target Architecture: Cortex Platform

### Feature Matrix
| Feature | Description | Priority |
|---------|-------------|----------|
| RPC API | Multi-chain JSON-RPC proxy with load balancing | P0 |
| WebSockets | Real-time blockchain subscriptions | P0 |
| Token API | ERC-20/ERC-721/ERC-1155 balances & metadata | P0 |
| NFT API | NFT collections, ownership, metadata | P1 |
| Transfers API | Transaction history & transfers | P1 |
| Webhooks | Event-driven notifications | P1 |
| Smart Wallets | ERC-4337 account abstraction | P1 |
| Bundler API | UserOp bundling for AA | P2 |
| Gas Manager API | Paymaster & gas sponsorship | P2 |
| Rollups | L2 support (OP Stack, Arbitrum, zkSync) | P2 |

### Supported Chains (Phase 1)
- **EVM**: Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BNB Chain, Lux
- **Non-EVM**: Solana, Bitcoin (read-only)
- **L2/Rollups**: OP Stack chains, Arbitrum Orbit, zkSync Era

### Modern Tech Stack
```
bootnode/
├── api/                    # FastAPI backend (Python 3.12+)
│   ├── bootnode/
│   │   ├── api/           # API routes
│   │   │   ├── rpc/       # JSON-RPC proxy
│   │   │   ├── tokens/    # Token API
│   │   │   ├── nfts/      # NFT API
│   │   │   ├── transfers/ # Transfers API
│   │   │   ├── webhooks/  # Webhook management
│   │   │   ├── wallets/   # Smart wallet API
│   │   │   ├── bundler/   # ERC-4337 bundler
│   │   │   └── gas/       # Gas manager
│   │   ├── core/          # Core business logic
│   │   │   ├── chains/    # Chain configurations
│   │   │   ├── indexer/   # Event indexing
│   │   │   └── cache/     # Caching layer
│   │   ├── db/            # Database models
│   │   └── ws/            # WebSocket handlers
│   ├── pyproject.toml
│   └── Dockerfile
├── web/                    # Next.js 15 dashboard
│   ├── app/               # App router
│   ├── components/        # @hanzo/ui components
│   └── package.json
├── indexer/               # Event indexer service
│   ├── src/
│   └── Cargo.toml         # Rust for performance
├── infra/                 # Infrastructure
│   ├── k8s/               # Kubernetes manifests
│   ├── terraform/         # IaC
│   └── compose.yml        # Local development
└── docs/                  # Documentation
```

### API Design

#### RPC API
```
POST /v1/rpc/{chain}
POST /v1/rpc/{chain}/{network}
Headers: X-API-Key: <api_key>

# Example
POST /v1/rpc/ethereum/mainnet
{
  "jsonrpc": "2.0",
  "method": "eth_blockNumber",
  "params": [],
  "id": 1
}
```

#### Token API
```
GET  /v1/tokens/{chain}/balances/{address}
GET  /v1/tokens/{chain}/metadata/{contract}
GET  /v1/tokens/{chain}/holders/{contract}
GET  /v1/tokens/{chain}/transfers/{address}
```

#### NFT API
```
GET  /v1/nfts/{chain}/collections/{address}
GET  /v1/nfts/{chain}/owned/{address}
GET  /v1/nfts/{chain}/metadata/{contract}/{tokenId}
GET  /v1/nfts/{chain}/transfers/{address}
POST /v1/nfts/{chain}/refresh-metadata/{contract}/{tokenId}
```

#### Webhooks
```
POST   /v1/webhooks
GET    /v1/webhooks
DELETE /v1/webhooks/{id}
GET    /v1/webhooks/{id}/deliveries

# Webhook Types
- ADDRESS_ACTIVITY      # Any tx involving address
- MINED_TRANSACTION     # Tx confirmation
- NFT_ACTIVITY          # NFT transfers
- TOKEN_TRANSFER        # ERC-20 transfers
- INTERNAL_TRANSFER     # Internal ETH transfers
- GRAPHQL               # Custom GraphQL filters
```

#### WebSocket Subscriptions
```
WS /v1/ws/{chain}

# Subscribe to new blocks
{"jsonrpc":"2.0","method":"eth_subscribe","params":["newHeads"],"id":1}

# Subscribe to pending txs
{"jsonrpc":"2.0","method":"eth_subscribe","params":["pendingTransactions"],"id":2}

# Subscribe to logs (events)
{"jsonrpc":"2.0","method":"eth_subscribe","params":["logs",{"address":"0x..."}],"id":3}
```

#### Smart Wallets (ERC-4337)
```
POST /v1/wallets/create
GET  /v1/wallets/{address}
POST /v1/wallets/{address}/sign
POST /v1/wallets/{address}/execute
```

#### Bundler API
```
POST /v1/bundler/{chain}
{
  "jsonrpc": "2.0",
  "method": "eth_sendUserOperation",
  "params": [userOp, entryPoint],
  "id": 1
}

# Supported methods:
# - eth_sendUserOperation
# - eth_estimateUserOperationGas
# - eth_getUserOperationByHash
# - eth_getUserOperationReceipt
# - eth_supportedEntryPoints
```

#### Gas Manager API
```
POST /v1/gas/sponsor
POST /v1/gas/estimate
GET  /v1/gas/prices/{chain}
GET  /v1/gas/policies
POST /v1/gas/policies
```

### Database Schema (PostgreSQL)
```sql
-- API Keys & Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  key_hash TEXT NOT NULL,
  name TEXT,
  rate_limit INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  url TEXT NOT NULL,
  chain TEXT NOT NULL,
  event_type TEXT NOT NULL,
  filters JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE usage (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  chain TEXT NOT NULL,
  method TEXT NOT NULL,
  compute_units INT DEFAULT 1,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Caching Strategy
- **Redis**: RPC response caching, rate limiting, session management
- **CDN**: Static NFT metadata, token logos
- **Memory**: Hot chain data, recent blocks

### Compute Unit Pricing
| Method Category | CU Cost |
|-----------------|---------|
| eth_blockNumber, eth_chainId | 1 |
| eth_getBalance, eth_getCode | 5 |
| eth_call, eth_estimateGas | 10 |
| eth_getLogs (100 blocks) | 25 |
| eth_sendRawTransaction | 50 |
| debug_*, trace_* | 100+ |
| NFT/Token API calls | 5-25 |

## Implementation Progress

### Phase 1: Core Infrastructure ✅ COMPLETE
- [x] FastAPI backend with proper project structure (Python 3.12+)
- [x] Multi-chain RPC proxy (100+ chains supported)
- [x] WebSocket subscriptions
- [x] PostgreSQL schema with SQLAlchemy 2.0 async
- [x] API key authentication & rate limiting
- [x] Next.js 15 dashboard with @hanzo/ui

### Phase 2: Enhanced APIs ✅ COMPLETE
- [x] Token API (balances, metadata, transfers)
- [x] NFT API (collections, ownership, metadata)
- [x] Transfers API (transaction history)
- [x] Webhook system with RabbitMQ
- [x] Usage tracking via DataStore (ClickHouse)

### Phase 3: Account Abstraction ✅ COMPLETE
- [x] ERC-4337 bundler implementation
- [x] Smart wallet creation & management
- [x] Gas manager / paymaster policies
- [x] UserOp simulation & estimation

### Phase 4: Infrastructure ✅ COMPLETE
- [x] Docker Compose full stack
- [x] Kubernetes manifests with HPA/PDB
- [x] Multi-cloud deployment (AWS, GCP, Azure, DigitalOcean)
- [x] DataStore (ClickHouse) for high-performance analytics
- [x] Multi-chain indexer (forked from lux/indexer)

## Development Commands

```bash
# Backend
cd api
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"
uvicorn bootnode.main:app --reload

# Frontend
cd web
pnpm install
pnpm dev

# Infrastructure
docker compose up -d  # Local dev with Postgres, Redis

# Tests
pytest api/tests/
pnpm test --prefix web
```

## Key Dependencies

### Backend (Python)
- fastapi >= 2.0
- uvicorn[standard]
- sqlalchemy >= 2.0
- asyncpg
- redis
- web3.py
- pydantic >= 2.0
- httpx
- websockets

### Frontend (TypeScript)
- next >= 15.0
- react >= 19.0
- @hanzo/ui
- wagmi
- viem
- @tanstack/react-query
- tailwindcss

## Environment Variables
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/bootnode

# Redis
REDIS_URL=redis://localhost:6379

# Chain RPCs (upstream nodes)
ETH_MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/...
ETH_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/...
POLYGON_MAINNET_RPC=https://polygon-mainnet.g.alchemy.com/v2/...
# ... more chains

# Auth
JWT_SECRET=...
API_KEY_SALT=...

# External Services
IPFS_GATEWAY=https://ipfs.io/ipfs/
```

## Notes
- Use uv for Python package management (per user preference)
- Use compose.yml not docker-compose.yml
- Never commit .env files or API keys
- Follow Hanzo AI conventions for @hanzo/ui components

## Current Architecture

### Project Structure
```
bootnode/
├── api/                        # FastAPI backend (Python 3.12+)
│   └── bootnode/
│       ├── api/                # API routes (rpc, tokens, nfts, etc.)
│       ├── core/               # Business logic
│       │   ├── cache/          # Redis caching
│       │   └── datastore/      # ClickHouse client
│       ├── db/                 # SQLAlchemy models
│       ├── workers/            # Background workers (webhooks)
│       └── ws/                 # WebSocket handlers
├── web/                        # Next.js 15 dashboard
│   └── app/
│       ├── dashboard/          # Admin dashboard pages
│       └── docs/               # Documentation
├── indexer/                    # Go multi-chain indexer
│   └── cmd/multichain/         # Main indexer binary
└── infra/                      # Infrastructure
    ├── compose.yml             # Docker Compose (full stack)
    ├── k8s/                    # Kubernetes manifests
    ├── cloud/                  # Cloud deployment configs
    │   ├── aws/                # EKS cluster
    │   ├── gcp/                # GKE cluster
    │   ├── azure/              # AKS cluster
    │   └── digitalocean/       # DOKS cluster
    ├── config/                 # Chain configurations
    └── monitoring/             # VictoriaMetrics/Grafana
        ├── scrape.yml          # VMAgent scrape config
        └── grafana-datasources.yml
```

### Data Layer
- **PostgreSQL**: Operational data (projects, API keys, webhooks, wallets)
- **DataStore (ClickHouse)**: Analytics & indexed blockchain data (Hanzo's fork)
- **Redis**: Caching, rate limiting, message queue (BullMQ/@hanzo/mq compatible via arq)
- **VictoriaMetrics**: Time-series metrics (Hanzo's fork, replaces Prometheus)

### Hanzo Integration
Bootnode powers the Blockchain & Web3 products on [hanzo.ai](https://hanzo.ai/blockchain):
- Products navigation includes "Blockchain & Web3" category
- Pricing page has dedicated "Blockchain" tab
- Featured in main products grid and footer
- Branded as "Hanzo Blockchain" / "Hanzo Chain"

### Supported Chains (100+)
**Layer 1**: Ethereum, BNB Chain, Avalanche, Gnosis, Celo, Rootstock, Solana, Aptos, Flow, Berachain, Sei, Sonic, Tron, TON

**Optimistic L2**: Arbitrum (One, Nova), Optimism, Base, Blast, Mantle, Metis, Mode, Zora, opBNB

**ZK L2**: Polygon zkEVM, zkSync Era, Scroll, Linea, Starknet

**Other**: Polygon PoS, Astar, ZetaChain, World Chain, Abstract, Soneium, Lux Network

### Deployment
```bash
# Local development
cd infra && docker compose up -d

# With monitoring
docker compose --profile monitoring up -d

# With bundler (ERC-4337)
docker compose --profile bundler up -d

# Cloud deployment
./cloud/deploy.sh aws|gcp|azure|digitalocean
```

### Key Files
- `api/bootnode/config.py` - Application settings (datastore, redis MQ)
- `api/bootnode/main.py` - FastAPI application entry
- `api/bootnode/core/datastore/client.py` - ClickHouse client
- `api/bootnode/workers/webhook.py` - Webhook delivery worker (arq/Redis-based)
- `api/pyproject.toml` - Python dependencies (arq, aiochclient)
- `infra/compose.yml` - Full Docker Compose stack (VictoriaMetrics, VMAgent)
- `infra/config/chains.yaml` - Multi-chain configuration
- `infra/monitoring/scrape.yml` - VMAgent scrape config
- `infra/.env.example` - Environment variables template
- `indexer/README.md` - Indexer documentation
