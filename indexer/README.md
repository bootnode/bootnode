# Bootnode Indexer

Multi-chain blockchain indexer for the Bootnode platform. Forked from [luxfi/indexer](https://github.com/luxfi/indexer).

## Features

- **100+ Chain Support**: Indexes data from Ethereum, Solana, Bitcoin, and 97+ other chains
- **High Performance**: Optimized for high-throughput indexing with parallel processing
- **DataStore Integration**: Writes indexed data to ClickHouse for fast analytics queries
- **Protocol Indexing**: Supports 50+ DeFi, NFT, and bridge protocols
- **Real-time Events**: Publishes events to RabbitMQ for webhook delivery

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Bootnode Indexer                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ EVM      │  │ Solana   │  │ Bitcoin  │  │ Lux      │        │
│  │ Indexer  │  │ Indexer  │  │ Indexer  │  │ Native   │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                           │                                     │
│                    ┌──────┴──────┐                              │
│                    │   Manager   │                              │
│                    └──────┬──────┘                              │
├───────────────────────────┼─────────────────────────────────────┤
│  Storage Layer            │                                     │
│  ┌────────────┐  ┌────────┴───────┐  ┌───────────────┐         │
│  │ PostgreSQL │  │   DataStore    │  │   RabbitMQ    │         │
│  │ (Metadata) │  │  (ClickHouse)  │  │   (Events)    │         │
│  └────────────┘  └────────────────┘  └───────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Supported Chains

### EVM Chains
- Ethereum (mainnet, sepolia, holesky)
- Arbitrum (one, nova, sepolia)
- Base (mainnet, sepolia)
- Optimism (mainnet, sepolia)
- Polygon (PoS, zkEVM)
- zkSync Era
- Scroll
- Linea
- BNB Chain (mainnet, opBNB)
- Avalanche C-Chain
- Gnosis
- Celo
- Blast
- Mantle
- Mode
- Zora
- And 50+ more...

### Non-EVM Chains
- Solana (mainnet, devnet)
- Bitcoin (mainnet, testnet)
- Aptos
- Starknet
- Flow
- Tron
- TON

### Lux Native
- C-Chain (EVM)
- P-Chain (Platform/Staking)
- X-Chain (Assets/DAG)

## Configuration

Configuration is done via `config/chains.yaml`:

```yaml
ethereum:
  mainnet:
    chain_id: 1
    name: "Ethereum Mainnet"
    type: evm
    rpc: "${ETH_MAINNET_RPC}"
    enabled: true
    protocols:
      - uniswap_v3
      - aave_v3
      - seaport
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/bootnode
DATASTORE_URL=clickhouse://user:pass@localhost:8123/bootnode

# Message Queue
RABBITMQ_URL=amqp://user:pass@localhost:5672/

# Cache
REDIS_URL=redis://localhost:6379/1

# Settings
CONFIG_PATH=/app/config/chains.yaml
LOG_LEVEL=info
MAX_CHAINS=100
BATCH_SIZE=1000
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /stats` | Aggregate indexing stats |
| `GET /chains` | Per-chain stats |
| `GET /chain/{id}` | Individual chain stats |
| `GET /metrics` | Prometheus metrics |

## Running Locally

```bash
# With Go
go run ./cmd/multichain --config config/chains.yaml

# With Docker
docker build -t bootnode/indexer .
docker run -p 5000:5000 \
  -e DATABASE_URL=... \
  -e DATASTORE_URL=... \
  bootnode/indexer
```

## Development

```bash
# Install dependencies
go mod download

# Run tests
go test ./...

# Build
go build -o indexer ./cmd/multichain

# Run
./indexer --config config/chains.yaml
```

## Adding New Chains

1. Add chain config to `config/chains.yaml`
2. If new chain type, create adapter in `multichain/`
3. Implement `ChainIndexer` interface
4. Add schema migration if needed

## License

BSD-3-Clause
