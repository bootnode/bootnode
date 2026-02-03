# Bootnode

**Web3 Backend in a Box** - Run locally or deploy to cloud.

## Quick Start

```bash
docker compose up -d
```

Done. Your Web3 backend is running:
- **API:** http://localhost:8000
- **Dashboard:** http://localhost:3001
- **API Docs:** http://localhost:8000/docs

## Features

| API | Description |
|-----|-------------|
| `POST /v1/rpc/{chain}` | Multi-chain JSON-RPC proxy |
| `WS /v1/ws/{chain}` | Real-time blockchain subscriptions |
| `GET /v1/tokens/{chain}/balances/{address}` | Token balances & metadata |
| `GET /v1/nfts/{chain}/owned/{address}` | NFT ownership & metadata |
| `POST /v1/webhooks` | Event-driven notifications |
| `POST /v1/wallets/create` | ERC-4337 smart wallets |
| `POST /v1/bundler/{chain}` | UserOp bundling |
| `POST /v1/gas/sponsor` | Gas sponsorship |

## Supported Chains

**L1:** Ethereum, BNB Chain, Avalanche, Solana, Bitcoin

**L2:** Arbitrum, Optimism, Base, Polygon, zkSync, Scroll, Linea, Blast

## Development

```bash
# API (Python 3.12+)
cd api && uv sync && uvicorn bootnode.main:app --reload --port 8000

# Dashboard (Node 22+)
cd web && pnpm install && pnpm dev
```

## Deploy

### Self-hosted
```bash
docker compose -f docker-compose.prod.yml up -d
# or
kubectl apply -f infra/k8s/
```

### Hanzo Cloud
```bash
hanzo deploy
```

Visit [web3.hanzo.ai](https://web3.hanzo.ai) for managed hosting.

## License

Apache-2.0
