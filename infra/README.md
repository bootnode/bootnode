# Bootnode Infrastructure

Docker Compose and Kubernetes configurations for running the Bootnode blockchain development platform.

## Quick Start

### Prerequisites

- Docker & Docker Compose v2
- 8GB+ RAM recommended
- Configure RPC endpoints in `.env`

### Local Development

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your RPC endpoints and secrets
vim .env

# Start core services
docker compose up -d

# View logs
docker compose logs -f

# Check health
curl http://localhost:8000/health
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| API | 8000 | Bootnode FastAPI backend |
| Web | 3001 | Next.js dashboard |
| Indexer | 5000 | Multi-chain blockchain indexer |
| PostgreSQL | 5432 | Operational database |
| Redis | 6379 | Cache & rate limiting |
| DataStore | 8123 | ClickHouse analytics |
| RabbitMQ | 5672, 15672 | Message queue |

### Profiles

```bash
# Core services only
docker compose up -d

# With monitoring (Prometheus + Grafana)
docker compose --profile monitoring up -d

# With ERC-4337 bundler
docker compose --profile bundler up -d

# Everything
docker compose --profile monitoring --profile bundler up -d
```

### Scaling

```bash
# Scale API horizontally
docker compose up -d --scale api=3
```

## Kubernetes

Deploy to Kubernetes clusters on any cloud provider.

### Prerequisites

- kubectl configured
- Helm 3 installed
- Cluster with 3+ nodes (8GB+ RAM each)

### Deploy

```bash
# Create namespace and secrets
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy services
kubectl apply -f k8s/

# Check status
kubectl -n bootnode get pods
```

### Cloud-Specific Deployment

```bash
# AWS EKS
./cloud/deploy.sh aws

# Google Cloud GKE
./cloud/deploy.sh gcp

# Azure AKS
./cloud/deploy.sh azure

# DigitalOcean DOKS
./cloud/deploy.sh digitalocean
```

## Configuration

### Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `DATASTORE_URL` - ClickHouse connection
- `*_RPC` - Chain RPC endpoints

### Chain Configuration

Edit `config/chains.yaml` to enable/disable chains and configure protocols.

```yaml
ethereum:
  mainnet:
    chain_id: 1
    enabled: true
    protocols:
      - uniswap_v3
      - aave_v3
```

## Monitoring

### Prometheus

Access at http://localhost:9091

Metrics available:
- API request latency
- RPC call counts
- Indexer block height
- Queue depth

### Grafana

Access at http://localhost:3000

Default credentials: admin / bootnode

Pre-configured dashboards:
- API Overview
- Chain Status
- Indexer Progress

## Troubleshooting

### Service won't start

```bash
# Check logs
docker compose logs <service>

# Verify dependencies
docker compose ps
```

### Database connection issues

```bash
# Ensure postgres is healthy
docker compose exec postgres pg_isready

# Reset database
docker compose down -v
docker compose up -d
```

### High memory usage

```bash
# Limit indexer chains
MAX_CHAINS=10 docker compose up -d indexer
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │   API   │  │   API   │  │   Web   │  │ Indexer │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
│       │            │            │            │                   │
│       └────────────┴────────────┴────────────┘                   │
│                           │                                      │
│  ┌────────────────────────┴────────────────────────┐            │
│  │                   Data Layer                     │            │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │            │
│  │  │PostgreSQL│  │  Redis   │  │  DataStore   │  │            │
│  │  └──────────┘  └──────────┘  └──────────────┘  │            │
│  └──────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```
