import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocsLayout } from "@/components/docs-layout"
import { docsConfig } from "@/lib/docs-config"

export const metadata = {
  title: "Changelog",
  description: `${docsConfig.brandName} platform changelog and release notes.`,
}

export default function ChangelogPage() {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">Changelog</h1>
          <p className="text-lg text-muted-foreground">
            All notable changes to the {docsConfig.brandName} platform, API, and SDKs.
          </p>
        </div>

        {/* v2.0.0 */}
        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl">v2.0.0</CardTitle>
                  <Badge>Latest</Badge>
                </div>
                <span className="text-sm text-muted-foreground">January 2026</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                General availability of the {docsConfig.brandName} platform. This is a complete rewrite
                with a unified API, new product lines, and multi-chain support from day one.
              </p>

              <div>
                <h3 className="font-semibold mb-3">Multi-Chain RPC (Node)</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                  <li>Support for 100+ blockchain networks with 99.999% uptime SLA</li>
                  <li>Ethereum, Solana, Base, Arbitrum, Polygon, Optimism, Avalanche, BNB Smart Chain, Lux Network, and more</li>
                  <li>Full EVM JSON-RPC support including archive data, debug/trace methods, and eth_subscribe</li>
                  <li>Solana JSON-RPC with getAccountInfo, getTransaction, and all standard methods</li>
                  <li>Intelligent routing across multiple node providers for maximum reliability</li>
                  <li>WebSocket subscriptions for newHeads, logs, and newPendingTransactions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Smart Wallets</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                  <li>ERC-4337 smart wallet creation with deterministic (counterfactual) addresses</li>
                  <li>Automatic on-chain deployment when the first UserOperation is sent</li>
                  <li>Multi-chain support: Ethereum, Base, Arbitrum, Optimism, Polygon, and more</li>
                  <li>Wallet management API: create, list, and query smart wallets</li>
                  <li>Session keys and batch execution support</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Webhooks</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                  <li>Real-time on-chain event notifications via HTTPS POST</li>
                  <li>Event types: address_activity, token_transfer, nft_transfer, mined_transaction, log</li>
                  <li>HMAC-SHA256 signature verification for secure delivery</li>
                  <li>Automatic retries with exponential backoff (5 attempts over 6 hours)</li>
                  <li>Webhook management API: create, list, update, pause, and delete</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Gas Manager</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                  <li>Gas sponsorship policies with per-user rate limits and contract allowlists</li>
                  <li>Paymaster integration for ERC-4337 UserOperations</li>
                  <li>Real-time gas price estimates (slow, standard, fast) for all EVM chains</li>
                  <li>Spending controls: max gas per operation, daily per-user limits, method-level allowlists</li>
                  <li>Dashboard analytics for gas spending and sponsorship usage</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Bundler</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                  <li>ERC-4337 bundler for submitting and managing UserOperations</li>
                  <li>Supports eth_sendUserOperation, eth_estimateUserOperationGas, eth_getUserOperationByHash, and eth_getUserOperationReceipt</li>
                  <li>EntryPoint v0.6 and v0.7 support</li>
                  <li>Available on all EVM chains with ERC-4337 support</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Data APIs</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                  <li>Token API: ERC-20 balances, metadata, prices, and transfer history</li>
                  <li>NFT API: ERC-721/ERC-1155 metadata, collection data, owned NFTs, and traits</li>
                  <li>Cross-chain data access with a unified API format</li>
                  <li>Real-time indexing with sub-second latency on supported chains</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">SDKs</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                  <li>TypeScript/JavaScript SDK v2.0 with full API coverage and WebSocket support</li>
                  <li>Python SDK v2.0 with async-first design and Pydantic models</li>
                  <li>Go SDK v1.0 with context-aware, idiomatic API</li>
                  <li>Rust SDK v0.9 with Tokio async and Serde serialization</li>
                  <li>All SDKs include automatic retry logic and structured error handling</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Platform</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                  <li>New dashboard at {docsConfig.dashboardUrl.replace("https://", "")} with usage analytics, API key management, and webhook monitoring</li>
                  <li>Unified authentication via X-API-Key or Bearer token</li>
                  <li>Scoped API keys for least-privilege access</li>
                  <li>Rate limiting with per-plan compute unit budgets</li>
                  <li>llms.txt endpoint for AI agent discovery</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* v1.0.0 */}
        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-xl">v1.0.0</CardTitle>
                <span className="text-sm text-muted-foreground">November 2025</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Beta launch of the {docsConfig.brandName} platform with core RPC proxy and Token API functionality.
              </p>

              <div>
                <h3 className="font-semibold mb-3">RPC Proxy</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                  <li>JSON-RPC proxy for Ethereum mainnet and Sepolia testnet</li>
                  <li>Support for all standard Ethereum JSON-RPC methods</li>
                  <li>Basic load balancing across multiple node providers</li>
                  <li>API key authentication</li>
                  <li>Rate limiting at 10 requests/second for free tier</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Token API (Beta)</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                  <li>ERC-20 token balance queries for Ethereum mainnet</li>
                  <li>Token metadata including name, symbol, decimals, and logo</li>
                  <li>Basic price data from aggregated feeds</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Platform</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                  <li>Dashboard with API key management and basic usage stats</li>
                  <li>TypeScript SDK v1.0 with RPC and Token API support</li>
                  <li>Python SDK v1.0 (beta)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DocsLayout>
  )
}
