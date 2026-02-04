import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocsLayout } from "@/components/docs-layout"
import { docsConfig } from "@/lib/docs-config"

export const metadata = {
  title: "API Reference",
  description: `Complete API reference for all ${docsConfig.brandName} endpoints.`,
}

function Endpoint({
  method,
  path,
  description,
  params,
  request,
  response,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE" | "WS"
  path: string
  description: string
  params?: { name: string; type: string; description: string; required?: boolean }[]
  request?: string
  response: string
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-green-500/10 text-green-500 border-green-500/20",
    POST: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    PATCH: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
    WS: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  }

  return (
    <Card id={path.replace(/[/{}\s]/g, "-").replace(/^-+|-+$/g, "")}>
      <CardHeader>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={`font-mono text-xs ${methodColors[method]}`}>{method}</Badge>
          <code className="text-sm font-mono">{path}</code>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {params && params.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Parameters</h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Required</th>
                    <th className="text-left p-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((p) => (
                    <tr key={p.name} className="border-b last:border-0">
                      <td className="p-3 font-mono text-xs">{p.name}</td>
                      <td className="p-3 text-muted-foreground">{p.type}</td>
                      <td className="p-3">{p.required !== false ? "Yes" : "No"}</td>
                      <td className="p-3 text-muted-foreground">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {request && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Request</h4>
            <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
              <code>{request}</code>
            </pre>
          </div>
        )}
        <div>
          <h4 className="text-sm font-semibold mb-2">Response</h4>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{response}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ApiReferencePage() {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">API Reference</h1>
          <p className="text-lg text-muted-foreground">
            Complete reference for all {docsConfig.brandName} REST and JSON-RPC endpoints.
          </p>
        </div>

        {/* Authentication */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Authentication</h2>
          <p className="text-muted-foreground">
            All API requests require authentication via one of two methods:
          </p>
          <div className="space-y-2">
            <div className="border rounded-lg p-4">
              <p className="font-medium text-sm mb-1">API Key Header</p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
                <code>{`X-API-Key: ${docsConfig.apiKeyPrefix}live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`}</code>
              </pre>
            </div>
            <div className="border rounded-lg p-4">
              <p className="font-medium text-sm mb-1">Bearer Token</p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
                <code>{`Authorization: Bearer ${docsConfig.apiKeyPrefix}live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Base URL */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Base URL</h2>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`${docsConfig.apiUrl}/v1`}</code>
          </pre>
        </section>

        {/* Rate Limits */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Rate Limits</h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Plan</th>
                  <th className="text-left p-3 font-medium">Requests / second</th>
                  <th className="text-left p-3 font-medium">Requests / day</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">Free</td>
                  <td className="p-3">10</td>
                  <td className="p-3">100,000</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Growth</td>
                  <td className="p-3">100</td>
                  <td className="p-3">5,000,000</td>
                </tr>
                <tr>
                  <td className="p-3">Enterprise</td>
                  <td className="p-3">Unlimited</td>
                  <td className="p-3">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Rate limit headers are included in every response:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1706400000`}</code>
          </pre>
        </section>

        {/* RPC */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">RPC</h2>
          <Endpoint
            method="POST"
            path="/v1/rpc/{chain}/{network}"
            description="Proxy a JSON-RPC request to any supported blockchain. Supports all standard JSON-RPC methods for EVM chains, and chain-specific methods for non-EVM chains like Solana."
            params={[
              { name: "chain", type: "string", description: "Chain identifier (ethereum, polygon, solana, base, arbitrum, etc.)" },
              { name: "network", type: "string", description: "Network name (mainnet, sepolia, devnet, etc.)" },
            ]}
            request={`curl -X POST ${docsConfig.apiUrl}/v1/rpc/ethereum/mainnet \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_blockNumber",
    "params": []
  }'`}
            response={`{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x13a5e7f"
}`}
          />
        </section>

        {/* Tokens */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Tokens</h2>
          <div className="space-y-6">
            <Endpoint
              method="GET"
              path="/v1/tokens/{chain}/balances/{address}"
              description="Get all ERC-20 token balances for a wallet address, including token metadata and USD values."
              params={[
                { name: "chain", type: "string", description: "Chain identifier (ethereum, polygon, base, etc.)" },
                { name: "address", type: "string", description: "Wallet address (0x-prefixed hex)" },
                { name: "page", type: "integer", description: "Page number for pagination (default: 1)", required: false },
                { name: "limit", type: "integer", description: "Results per page, max 100 (default: 50)", required: false },
              ]}
              request={`curl ${docsConfig.apiUrl}/v1/tokens/ethereum/balances/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 \\
  -H "X-API-Key: YOUR_API_KEY"`}
              response={`{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "chain": "ethereum",
  "tokens": [
    {
      "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 6,
      "balance": "15230500000",
      "formatted_balance": "15230.50",
      "usd_value": "15230.50",
      "logo_url": "https://assets.web3.hanzo.ai/tokens/usdc.png"
    },
    {
      "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "symbol": "USDT",
      "name": "Tether USD",
      "decimals": 6,
      "balance": "8500000000",
      "formatted_balance": "8500.00",
      "usd_value": "8500.00",
      "logo_url": "https://assets.web3.hanzo.ai/tokens/usdt.png"
    }
  ],
  "page": 1,
  "total": 2
}`}
            />
            <Endpoint
              method="GET"
              path="/v1/tokens/{chain}/metadata/{contract}"
              description="Get metadata for a specific ERC-20 token contract, including name, symbol, decimals, total supply, and current price."
              params={[
                { name: "chain", type: "string", description: "Chain identifier" },
                { name: "contract", type: "string", description: "Token contract address (0x-prefixed hex)" },
              ]}
              request={`curl ${docsConfig.apiUrl}/v1/tokens/ethereum/metadata/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 \\
  -H "X-API-Key: YOUR_API_KEY"`}
              response={`{
  "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "chain": "ethereum",
  "name": "USD Coin",
  "symbol": "USDC",
  "decimals": 6,
  "total_supply": "26000000000000000",
  "formatted_total_supply": "26000000000.00",
  "price_usd": "1.00",
  "market_cap_usd": "26000000000.00",
  "logo_url": "https://assets.web3.hanzo.ai/tokens/usdc.png"
}`}
            />
          </div>
        </section>

        {/* NFTs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">NFTs</h2>
          <div className="space-y-6">
            <Endpoint
              method="GET"
              path="/v1/nfts/{chain}/metadata/{contract}/{token_id}"
              description="Get metadata for a specific NFT including name, description, image URL, traits, and ownership info."
              params={[
                { name: "chain", type: "string", description: "Chain identifier" },
                { name: "contract", type: "string", description: "NFT contract address" },
                { name: "token_id", type: "string", description: "Token ID" },
              ]}
              request={`curl ${docsConfig.apiUrl}/v1/nfts/ethereum/metadata/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D/1234 \\
  -H "X-API-Key: YOUR_API_KEY"`}
              response={`{
  "contract": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
  "token_id": "1234",
  "name": "Bored Ape #1234",
  "description": "A unique Bored Ape Yacht Club NFT.",
  "image_url": "ipfs://QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ",
  "image_gateway_url": "https://ipfs.web3.hanzo.ai/ipfs/QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ",
  "standard": "ERC721",
  "owner": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "traits": [
    { "trait_type": "Background", "value": "Aquamarine" },
    { "trait_type": "Fur", "value": "Dark Brown" },
    { "trait_type": "Eyes", "value": "Bored" },
    { "trait_type": "Mouth", "value": "Grin" }
  ]
}`}
            />
            <Endpoint
              method="GET"
              path="/v1/nfts/{chain}/collection/{contract}"
              description="Get collection-level metadata for an NFT contract, including name, floor price, total supply, and stats."
              params={[
                { name: "chain", type: "string", description: "Chain identifier" },
                { name: "contract", type: "string", description: "NFT contract address" },
              ]}
              request={`curl ${docsConfig.apiUrl}/v1/nfts/ethereum/collection/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D \\
  -H "X-API-Key: YOUR_API_KEY"`}
              response={`{
  "contract": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
  "chain": "ethereum",
  "name": "Bored Ape Yacht Club",
  "symbol": "BAYC",
  "standard": "ERC721",
  "total_supply": 10000,
  "num_owners": 6432,
  "floor_price_eth": "12.50",
  "floor_price_usd": "25000.00",
  "banner_url": "https://assets.web3.hanzo.ai/collections/bayc-banner.png",
  "image_url": "https://assets.web3.hanzo.ai/collections/bayc.png",
  "description": "The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs."
}`}
            />
            <Endpoint
              method="GET"
              path="/v1/nfts/{chain}/owned/{address}"
              description="Get all NFTs owned by a wallet address across all collections on the given chain."
              params={[
                { name: "chain", type: "string", description: "Chain identifier" },
                { name: "address", type: "string", description: "Wallet address" },
                { name: "page", type: "integer", description: "Page number (default: 1)", required: false },
                { name: "limit", type: "integer", description: "Results per page, max 100 (default: 50)", required: false },
              ]}
              request={`curl ${docsConfig.apiUrl}/v1/nfts/ethereum/owned/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 \\
  -H "X-API-Key: YOUR_API_KEY"`}
              response={`{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "chain": "ethereum",
  "nfts": [
    {
      "contract": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      "token_id": "1234",
      "name": "Bored Ape #1234",
      "collection_name": "Bored Ape Yacht Club",
      "image_url": "ipfs://QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ",
      "standard": "ERC721"
    }
  ],
  "page": 1,
  "total": 1
}`}
            />
          </div>
        </section>

        {/* Wallets */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Wallets</h2>
          <div className="space-y-6">
            <Endpoint
              method="POST"
              path="/v1/wallets/create"
              description="Create a new ERC-4337 smart wallet. The wallet is counterfactually deployed -- it exists at a deterministic address but is only deployed on-chain when the first transaction is sent."
              params={[
                { name: "owner", type: "string", description: "EOA address that owns this smart wallet" },
                { name: "chain", type: "string", description: "Chain to deploy on (ethereum, base, polygon, etc.)" },
                { name: "salt", type: "string", description: "Optional salt for deterministic address generation", required: false },
              ]}
              request={`curl -X POST ${docsConfig.apiUrl}/v1/wallets/create \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "owner": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "chain": "ethereum"
  }'`}
              response={`{
  "address": "0x7A0b3e4C5F1234567890abcdef1234567890ABCD",
  "owner": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "chain": "ethereum",
  "status": "counterfactual",
  "factory": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  "created_at": "2026-01-15T10:30:00Z"
}`}
            />
            <Endpoint
              method="GET"
              path="/v1/wallets/{address}"
              description="Get details of a specific smart wallet including its on-chain deployment status, owner, and transaction count."
              params={[
                { name: "address", type: "string", description: "Smart wallet address" },
              ]}
              request={`curl ${docsConfig.apiUrl}/v1/wallets/0x7A0b3e4C5F1234567890abcdef1234567890ABCD \\
  -H "X-API-Key: YOUR_API_KEY"`}
              response={`{
  "address": "0x7A0b3e4C5F1234567890abcdef1234567890ABCD",
  "owner": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "chain": "ethereum",
  "status": "deployed",
  "factory": "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  "nonce": 5,
  "created_at": "2026-01-15T10:30:00Z",
  "deployed_at": "2026-01-15T10:35:22Z",
  "deploy_tx": "0xabc123..."
}`}
            />
            <Endpoint
              method="GET"
              path="/v1/wallets"
              description="List all smart wallets associated with your API key, with pagination."
              params={[
                { name: "page", type: "integer", description: "Page number (default: 1)", required: false },
                { name: "limit", type: "integer", description: "Results per page, max 100 (default: 25)", required: false },
                { name: "chain", type: "string", description: "Filter by chain", required: false },
              ]}
              request={`curl ${docsConfig.apiUrl}/v1/wallets?chain=ethereum&limit=10 \\
  -H "X-API-Key: YOUR_API_KEY"`}
              response={`{
  "wallets": [
    {
      "address": "0x7A0b3e4C5F1234567890abcdef1234567890ABCD",
      "owner": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "chain": "ethereum",
      "status": "deployed",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "page": 1,
  "total": 1
}`}
            />
          </div>
        </section>

        {/* Webhooks */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Webhooks</h2>
          <div className="space-y-6">
            <Endpoint
              method="POST"
              path="/v1/webhooks"
              description={`Create a new webhook subscription. ${docsConfig.brandName} will POST events to your URL as they occur on-chain.`}
              params={[
                { name: "url", type: "string", description: "HTTPS endpoint to receive webhook events" },
                { name: "chain", type: "string", description: "Chain to monitor" },
                { name: "event_type", type: "string", description: "Event type: address_activity, token_transfer, nft_transfer, mined_transaction, log" },
                { name: "config", type: "object", description: "Event-specific filter configuration", required: false },
              ]}
              request={`curl -X POST ${docsConfig.apiUrl}/v1/webhooks \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "url": "https://myapp.com/api/webhooks/bootnode",
    "chain": "ethereum",
    "event_type": "address_activity",
    "config": {
      "addresses": ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"]
    }
  }'`}
              response={`{
  "id": "wh_a1b2c3d4e5f6",
  "url": "https://myapp.com/api/webhooks/bootnode",
  "chain": "ethereum",
  "event_type": "address_activity",
  "config": {
    "addresses": ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"]
  },
  "signing_secret": "whsec_k7m9p2q4r6s8t0v2w4x6y8z0",
  "status": "active",
  "created_at": "2026-01-15T10:30:00Z"
}`}
            />
            <Endpoint
              method="GET"
              path="/v1/webhooks"
              description="List all webhook subscriptions for your account."
              params={[
                { name: "page", type: "integer", description: "Page number (default: 1)", required: false },
                { name: "limit", type: "integer", description: "Results per page, max 100 (default: 25)", required: false },
                { name: "status", type: "string", description: "Filter by status: active, paused, disabled", required: false },
              ]}
              request={`curl ${docsConfig.apiUrl}/v1/webhooks \\
  -H "X-API-Key: YOUR_API_KEY"`}
              response={`{
  "webhooks": [
    {
      "id": "wh_a1b2c3d4e5f6",
      "url": "https://myapp.com/api/webhooks/bootnode",
      "chain": "ethereum",
      "event_type": "address_activity",
      "status": "active",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "page": 1,
  "total": 1
}`}
            />
            <Endpoint
              method="PATCH"
              path="/v1/webhooks/{id}"
              description="Update a webhook subscription. You can change the URL, status, or filter configuration."
              params={[
                { name: "id", type: "string", description: "Webhook ID (e.g. wh_a1b2c3d4e5f6)" },
                { name: "url", type: "string", description: "New webhook URL", required: false },
                { name: "status", type: "string", description: "Set status: active, paused", required: false },
                { name: "config", type: "object", description: "Updated filter configuration", required: false },
              ]}
              request={`curl -X PATCH ${docsConfig.apiUrl}/v1/webhooks/wh_a1b2c3d4e5f6 \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "status": "paused"
  }'`}
              response={`{
  "id": "wh_a1b2c3d4e5f6",
  "url": "https://myapp.com/api/webhooks/bootnode",
  "chain": "ethereum",
  "event_type": "address_activity",
  "status": "paused",
  "updated_at": "2026-01-15T12:00:00Z"
}`}
            />
            <Endpoint
              method="DELETE"
              path="/v1/webhooks/{id}"
              description="Permanently delete a webhook subscription. This action cannot be undone."
              params={[
                { name: "id", type: "string", description: "Webhook ID" },
              ]}
              request={`curl -X DELETE ${docsConfig.apiUrl}/v1/webhooks/wh_a1b2c3d4e5f6 \\
  -H "X-API-Key: YOUR_API_KEY"`}
              response={`{
  "id": "wh_a1b2c3d4e5f6",
  "deleted": true
}`}
            />
          </div>
        </section>

        {/* Gas */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Gas</h2>
          <div className="space-y-6">
            <Endpoint
              method="GET"
              path="/v1/gas/{chain}/prices"
              description="Get current gas prices for a chain, including slow, standard, and fast estimates."
              params={[
                { name: "chain", type: "string", description: "Chain identifier (ethereum, polygon, base, etc.)" },
              ]}
              request={`curl ${docsConfig.apiUrl}/v1/gas/ethereum/prices \\
  -H "X-API-Key: YOUR_API_KEY"`}
              response={`{
  "chain": "ethereum",
  "block_number": 20574335,
  "base_fee_gwei": "12.50",
  "estimates": {
    "slow": {
      "max_fee_gwei": "14.00",
      "max_priority_fee_gwei": "0.50",
      "estimated_seconds": 60
    },
    "standard": {
      "max_fee_gwei": "16.00",
      "max_priority_fee_gwei": "1.50",
      "estimated_seconds": 15
    },
    "fast": {
      "max_fee_gwei": "20.00",
      "max_priority_fee_gwei": "3.00",
      "estimated_seconds": 5
    }
  },
  "updated_at": "2026-01-15T10:30:00Z"
}`}
            />
            <Endpoint
              method="POST"
              path="/v1/gas/policies"
              description={`Create a gas sponsorship policy. Policies define rules for when ${docsConfig.brandName} will pay gas fees on behalf of your users.`}
              params={[
                { name: "name", type: "string", description: "Human-readable policy name" },
                { name: "chain", type: "string", description: "Chain this policy applies to" },
                { name: "rules", type: "object", description: "Sponsorship rules (max_gas_usd, allowed_contracts, rate_limit, etc.)" },
              ]}
              request={`curl -X POST ${docsConfig.apiUrl}/v1/gas/policies \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "name": "My App Free Gas",
    "chain": "base",
    "rules": {
      "max_gas_usd": "0.50",
      "max_per_user_per_day": 10,
      "allowed_contracts": [
        "0x1234567890abcdef1234567890abcdef12345678"
      ],
      "allowed_methods": ["transfer", "approve", "mint"]
    }
  }'`}
              response={`{
  "id": "gp_x1y2z3w4v5u6",
  "name": "My App Free Gas",
  "chain": "base",
  "rules": {
    "max_gas_usd": "0.50",
    "max_per_user_per_day": 10,
    "allowed_contracts": [
      "0x1234567890abcdef1234567890abcdef12345678"
    ],
    "allowed_methods": ["transfer", "approve", "mint"]
  },
  "status": "active",
  "created_at": "2026-01-15T10:30:00Z"
}`}
            />
            <Endpoint
              method="POST"
              path="/v1/gas/sponsor"
              description="Sponsor a specific UserOperation. Returns a signed paymaster data field to include in the UserOperation."
              params={[
                { name: "chain", type: "string", description: "Chain identifier" },
                { name: "policy_id", type: "string", description: "Gas policy ID" },
                { name: "user_operation", type: "object", description: "The UserOperation to sponsor" },
              ]}
              request={`curl -X POST ${docsConfig.apiUrl}/v1/gas/sponsor \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "chain": "base",
    "policy_id": "gp_x1y2z3w4v5u6",
    "user_operation": {
      "sender": "0x7A0b3e4C5F1234567890abcdef1234567890ABCD",
      "nonce": "0x0",
      "callData": "0xb61d27f6...",
      "callGasLimit": "0x5208",
      "verificationGasLimit": "0x186a0",
      "preVerificationGas": "0xc350",
      "maxFeePerGas": "0x3b9aca00",
      "maxPriorityFeePerGas": "0x59682f00"
    }
  }'`}
              response={`{
  "paymaster": "0xBootnodePaymasterAddress",
  "paymasterData": "0x0000000067b2c3d4...signed_data",
  "paymasterVerificationGasLimit": "0x30000",
  "paymasterPostOpGasLimit": "0x10000",
  "sponsored_gas_usd": "0.03"
}`}
            />
          </div>
        </section>

        {/* Bundler */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Bundler</h2>
          <Endpoint
            method="POST"
            path="/v1/bundler/{chain}/{network}"
            description="ERC-4337 bundler JSON-RPC endpoint. Supports eth_sendUserOperation, eth_estimateUserOperationGas, eth_getUserOperationByHash, eth_getUserOperationReceipt, and eth_supportedEntryPoints."
            params={[
              { name: "chain", type: "string", description: "Chain identifier" },
              { name: "network", type: "string", description: "Network name (mainnet, sepolia, etc.)" },
            ]}
            request={`curl -X POST ${docsConfig.apiUrl}/v1/bundler/ethereum/mainnet \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_sendUserOperation",
    "params": [
      {
        "sender": "0x7A0b3e4C5F1234567890abcdef1234567890ABCD",
        "nonce": "0x0",
        "initCode": "0x",
        "callData": "0xb61d27f6...",
        "callGasLimit": "0x5208",
        "verificationGasLimit": "0x186a0",
        "preVerificationGas": "0xc350",
        "maxFeePerGas": "0x3b9aca00",
        "maxPriorityFeePerGas": "0x59682f00",
        "paymasterAndData": "0x",
        "signature": "0xabcdef..."
      },
      "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
    ]
  }'`}
            response={`{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}`}
          />
        </section>

        {/* WebSocket */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">WebSocket</h2>
          <Endpoint
            method="WS"
            path="/v1/ws/{chain}/{network}"
            description="WebSocket endpoint for real-time blockchain subscriptions. Supports eth_subscribe for newHeads, logs, newPendingTransactions, and syncing."
            params={[
              { name: "chain", type: "string", description: "Chain identifier" },
              { name: "network", type: "string", description: "Network name (mainnet, sepolia, etc.)" },
            ]}
            request={`wscat -c "${docsConfig.wsUrl}/v1/ws/ethereum/mainnet?apiKey=YOUR_API_KEY"

> {"jsonrpc":"2.0","id":1,"method":"eth_subscribe","params":["newHeads"]}`}
            response={`{"jsonrpc":"2.0","id":1,"result":"0x1a2b3c4d"}

// Subsequent messages:
{
  "jsonrpc": "2.0",
  "method": "eth_subscription",
  "params": {
    "subscription": "0x1a2b3c4d",
    "result": {
      "number": "0x13a5e80",
      "hash": "0xabc123...",
      "parentHash": "0xdef456...",
      "timestamp": "0x67890abc",
      "gasUsed": "0xe4e1c0",
      "gasLimit": "0x1c9c380",
      "baseFeePerGas": "0x2e90edd00"
    }
  }
}`}
          />
        </section>

        {/* Error Codes */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Error Codes</h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">HTTP Status</th>
                  <th className="text-left p-3 font-medium">Error Code</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-mono">400</td>
                  <td className="p-3 font-mono">invalid_request</td>
                  <td className="p-3 text-muted-foreground">Malformed request body or missing required parameters</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono">401</td>
                  <td className="p-3 font-mono">unauthorized</td>
                  <td className="p-3 text-muted-foreground">Missing or invalid API key</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono">403</td>
                  <td className="p-3 font-mono">forbidden</td>
                  <td className="p-3 text-muted-foreground">API key does not have access to this resource</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono">404</td>
                  <td className="p-3 font-mono">not_found</td>
                  <td className="p-3 text-muted-foreground">Resource does not exist</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono">429</td>
                  <td className="p-3 font-mono">rate_limited</td>
                  <td className="p-3 text-muted-foreground">Rate limit exceeded. Check X-RateLimit headers.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono">500</td>
                  <td className="p-3 font-mono">internal_error</td>
                  <td className="p-3 text-muted-foreground">Internal server error. Retry with exponential backoff.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">All error responses follow this format:</p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded. Retry after 1 second.",
    "status": 429
  }
}`}</code>
          </pre>
        </section>
      </div>
    </DocsLayout>
  )
}
