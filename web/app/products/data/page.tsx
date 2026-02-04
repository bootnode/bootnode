"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Coins,
  Database,
  FileSearch,
  Filter,
  Globe,
  Image,
  Layers,
  Search,
  Zap,
} from "lucide-react"
import { getBrand } from "@/lib/brand"
import { docsConfig } from "@/lib/docs-config"

export default function DataProductPage() {
  const brand = getBrand()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="container relative py-24 md:py-32 lg:py-40">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <Badge variant="secondary" className="mb-4">
              <Database className="mr-1 h-3 w-3" />
              Unified Data APIs
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              All blockchain data,{" "}
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                one API call
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Token balances, NFT metadata, and transfer history across 100+
              chains. No indexing, no subgraphs, no infrastructure to
              manage. Query any onchain data with a single REST call.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="xl" asChild>
                <Link href="/dashboard">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/docs/data">API Reference</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Three API Tabs */}
      <section className="border-b py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three APIs, complete coverage
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our Data APIs handle the complex indexing, caching, and
              normalization so you never have to decode raw logs or parse
              transaction receipts again.
            </p>
          </div>

          {/* Token API */}
          <div className="mt-20">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <Coins className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold">Token API</h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Retrieve ERC-20 and native token balances, metadata, historical
                  prices, and allowances for any address on any supported chain.
                  A single call returns everything your portfolio view needs.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Balances for all tokens owned by an address in one call",
                    "Real-time and historical USD prices with 1-minute granularity",
                    "Full token metadata: name, symbol, decimals, logo URI",
                    "ERC-20 allowance lookups for spender contracts",
                    "Cross-chain balances aggregated in a single response",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <CodeBlock
                title="GET /v1/tokens/balances"
                code={`curl "${docsConfig.apiUrl}/v1/tokens/balances?\\
  address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&\\
  chains=ethereum,base,arbitrum" \\
  -H "X-API-Key: ${docsConfig.apiKeyPrefix}YOUR_API_KEY"

{
  "address": "0xd8dA6BF2...",
  "balances": [
    {
      "chain": "ethereum",
      "token": "0xA0b8...ec7",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 6,
      "balance": "125430000000",
      "balanceFormatted": "125430.0",
      "priceUsd": 1.0001,
      "valueUsd": 125442.53
    },
    {
      "chain": "ethereum",
      "token": "native",
      "symbol": "ETH",
      "decimals": 18,
      "balance": "4200000000000000000",
      "balanceFormatted": "4.2",
      "priceUsd": 3245.67,
      "valueUsd": 13631.81
    }
  ],
  "totalValueUsd": 139074.34
}`}
              />
            </div>
          </div>

          {/* NFT API */}
          <div className="mt-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="order-2 lg:order-1">
                <CodeBlock
                  title="GET /v1/nfts/owned"
                  code={`curl "${docsConfig.apiUrl}/v1/nfts/owned?\\
  address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&\\
  chain=ethereum&limit=2" \\
  -H "X-API-Key: ${docsConfig.apiKeyPrefix}YOUR_API_KEY"

{
  "address": "0xd8dA6BF2...",
  "chain": "ethereum",
  "nfts": [
    {
      "contract": "0xBC4CA0...a426f2",
      "tokenId": "8520",
      "standard": "ERC-721",
      "collection": "Bored Ape Yacht Club",
      "name": "BAYC #8520",
      "image": "https://media.${brand.domain}/ipfs/Qm...",
      "attributes": [
        { "trait_type": "Fur", "value": "Dark Brown" },
        { "trait_type": "Eyes", "value": "Bored" }
      ],
      "floorPrice": { "value": "12.4", "currency": "ETH" }
    }
  ],
  "totalCount": 47,
  "cursor": "eyJsYXN0X2lk..."
}`}
                />
              </div>
              <div className="order-1 flex flex-col justify-center lg:order-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                    <Image className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold">NFT API</h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Fetch NFTs owned by any address, collection metadata,
                  individual token details, and transfer history. Media files
                  from IPFS and Arweave are resolved and cached through our CDN
                  for instant loading.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Owned NFTs with full metadata and resolved media",
                    "IPFS and Arweave gateway with global CDN caching",
                    "Collection-level data: floor price, supply, holders",
                    "ERC-721 and ERC-1155 support with trait parsing",
                    "Spam detection filters out known scam tokens",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Transfers API */}
          <div className="mt-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <FileSearch className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold">Transfers API</h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Query the complete transfer history for any address, contract,
                  or token. Filter by direction, asset type, block range, or
                  counterparty. Results include decoded event data and USD values
                  at time of transfer.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "ERC-20, ERC-721, ERC-1155, and native transfers",
                    "Internal (trace-level) transfers included",
                    "Filter by from/to address, token, block range",
                    "USD value at the time of each transfer",
                    "Cursor-based pagination for large histories",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <CodeBlock
                title="GET /v1/transfers"
                code={`curl "${docsConfig.apiUrl}/v1/transfers?\\
  address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&\\
  chain=ethereum&category=erc20&limit=2" \\
  -H "X-API-Key: ${docsConfig.apiKeyPrefix}YOUR_API_KEY"

{
  "transfers": [
    {
      "hash": "0x3a1b...",
      "blockNumber": 19234567,
      "timestamp": "2025-01-15T14:23:01Z",
      "from": "0xd8dA6BF2...",
      "to": "0x7a250d56...",
      "category": "erc20",
      "token": {
        "address": "0xA0b8...ec7",
        "symbol": "USDC",
        "decimals": 6
      },
      "value": "50000000000",
      "valueFormatted": "50000.0",
      "valueUsd": 50005.0
    }
  ],
  "cursor": "eyJibG9ja..."
}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Brand Data */}
      <section className="border-b bg-muted/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why developers choose {brand.name} Data
            </h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Cross-Chain by Default"
              description="Every endpoint accepts a chains parameter. Query Ethereum, Base, Arbitrum, Polygon, and 96 more networks with the same request format and API key."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Real-Time Indexing"
              description="Data is available within seconds of block confirmation. No waiting for subgraph sync or indexer catch-up. You always get the latest state."
            />
            <FeatureCard
              icon={<Search className="h-6 w-6" />}
              title="Rich Filtering"
              description="Filter by token address, block range, transfer direction, asset category, and more. Get exactly the data you need without client-side post-processing."
            />
            <FeatureCard
              icon={<Layers className="h-6 w-6" />}
              title="Normalized Responses"
              description="Consistent JSON schemas across all chains. Token decimals are always formatted, addresses are checksummed, and timestamps follow ISO 8601."
            />
            <FeatureCard
              icon={<Filter className="h-6 w-6" />}
              title="Spam Filtering"
              description="Known spam tokens and phishing NFTs are automatically filtered. Opt in or out of spam filtering per request with a single query parameter."
            />
            <FeatureCard
              icon={<Blocks className="h-6 w-6" />}
              title="Batch Support"
              description="Query multiple addresses or tokens in a single request. Reduce round trips by up to 100x when building portfolio views or dashboards."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-20 sm:px-12 sm:py-28">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:14px_24px]" />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Stop building infrastructure. Start building products.
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Replace your indexing pipeline with a single API call. Free tier
                includes 100M compute units per month and access to all Data
                APIs.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="xl"
                  className="bg-white text-violet-600 hover:bg-white/90"
                  asChild
                >
                  <Link href="/dashboard">
                    Get Your API Key
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/docs/data">Explore the Docs</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center border-b px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}
