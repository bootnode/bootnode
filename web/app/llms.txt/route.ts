export async function GET() {
  const content = `# Bootnode
## Blockchain Infrastructure for Developers

> The complete blockchain development platform. Multi-chain RPC, Token APIs, NFT APIs, Smart Wallets, Webhooks, and more.

## Products
- Node: Multi-chain RPC with 99.999% uptime across 100+ chains
- Data: Token, NFT, and Transfer APIs
- Wallets: ERC-4337 Smart Wallets with Account Abstraction
- Webhooks: Real-time onchain event notifications
- Gas Manager: Gas sponsorship and paymaster policies
- Bundler: ERC-4337 bundler for UserOperations
- Rollups: Launch custom rollups

## API Base URL
https://api.bootnode.dev/v1

## Authentication
X-API-Key: <your-api-key>

## Endpoints
- POST /v1/rpc/{chain}/{network} - JSON-RPC proxy
- GET /v1/tokens/{chain}/balances/{address} - Token balances
- GET /v1/tokens/{chain}/metadata/{contract} - Token metadata
- GET /v1/nfts/{chain}/metadata/{contract}/{token_id} - NFT metadata
- GET /v1/nfts/{chain}/collection/{contract} - NFT collection info
- GET /v1/nfts/{chain}/owned/{address} - NFTs owned by address
- POST /v1/wallets/create - Create smart wallet
- GET /v1/wallets/{address} - Get wallet details
- GET /v1/wallets - List wallets
- POST /v1/webhooks - Create webhook
- GET /v1/webhooks - List webhooks
- PATCH /v1/webhooks/{id} - Update webhook
- DELETE /v1/webhooks/{id} - Delete webhook
- GET /v1/gas/{chain}/prices - Gas prices
- POST /v1/gas/policies - Create gas policy
- POST /v1/gas/sponsor - Sponsor a UserOperation
- POST /v1/bundler/{chain}/{network} - Bundler RPC
- WS /v1/ws/{chain}/{network} - WebSocket subscriptions

## Supported Chains
Ethereum, Solana, Base, Arbitrum, Polygon, Optimism, Avalanche, BNB Smart Chain, Lux Network, and 90+ more.

## Documentation
https://bootnode.dev/docs
`
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
