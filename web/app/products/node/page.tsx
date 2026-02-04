"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Globe,
  HardDrive,
  Layers,
  Network,
  RefreshCw,
  Shield,
  Wifi,
  Zap,
} from "lucide-react"
import { getBrand } from "@/lib/brand"
import { docsConfig } from "@/lib/docs-config"

export default function NodeProductPage() {
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
              <Globe className="mr-1 h-3 w-3" />
              Multi-Chain RPC
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              The fastest path to{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                any blockchain
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Access 100+ blockchain networks through a single, reliable RPC
              endpoint. Sub-100ms latency, 99.999% uptime, and zero
              configuration. Just plug in your API key and start building.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="xl" asChild>
                <Link href="/dashboard">
                  Get Your API Key
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/docs/rpc">Read the Docs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b bg-muted/30 py-8">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <StatItem label="Chains Supported" value="100+" />
            <StatItem label="Uptime SLA" value="99.999%" />
            <StatItem label="Avg. Latency" value="<80ms" />
            <StatItem label="Requests / Day" value="10B+" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-b py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Enterprise-grade infrastructure
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every feature you need to build production-ready blockchain
              applications, without managing your own nodes.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Sub-100ms Latency"
              description="Responses served from the nearest edge location in our global network. Intelligent request routing ensures every call takes the fastest path to the blockchain."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="MEV Protection"
              description="Private transaction submission prevents front-running and sandwich attacks. Your users' transactions are sent directly to block builders, bypassing the public mempool."
            />
            <FeatureCard
              icon={<HardDrive className="h-6 w-6" />}
              title="Archive Node Access"
              description="Query any historical state from genesis to the latest block. Full archive data is available on all major chains including Ethereum, Polygon, Arbitrum, and Base."
            />
            <FeatureCard
              icon={<Wifi className="h-6 w-6" />}
              title="WebSocket Subscriptions"
              description="Stream real-time data with persistent WebSocket connections. Subscribe to new blocks, pending transactions, log events, and contract state changes as they happen."
            />
            <FeatureCard
              icon={<Layers className="h-6 w-6" />}
              title="Batch Requests"
              description="Send up to 100 JSON-RPC calls in a single HTTP request. Batch processing reduces round trips and improves throughput for data-intensive applications."
            />
            <FeatureCard
              icon={<RefreshCw className="h-6 w-6" />}
              title="Automatic Failover"
              description="Multi-region redundancy with instant failover. If one node goes down, your request is transparently rerouted to a healthy node with zero downtime."
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Global Edge Caching"
              description="Frequently requested data is cached at over 200 edge locations worldwide. Read-heavy workloads benefit from dramatically reduced latency and node load."
            />
            <FeatureCard
              icon={<Network className="h-6 w-6" />}
              title="100+ Chains"
              description="Ethereum, Solana, Base, Arbitrum, Optimism, Polygon, BNB Chain, Avalanche, Fantom, Lux, and many more. New chains are added every week."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Enhanced APIs"
              description="Go beyond standard JSON-RPC with enhanced methods for token balances, NFT data, transaction history, and more. One endpoint for everything."
            />
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="border-b bg-muted/30 py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                One line to production
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Replace your RPC URL and you are live. {brand.name} is fully
                compatible with every Ethereum JSON-RPC method, plus enhanced
                methods for richer data access.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Drop-in replacement for any RPC provider",
                  "Standard JSON-RPC 2.0 over HTTPS and WSS",
                  "Compatible with ethers.js, viem, web3.js, and all major SDKs",
                  "Built-in rate limiting with generous free tier",
                  "Detailed analytics in your dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <CodeBlock
                title="curl"
                code={`curl -X POST ${docsConfig.apiUrl}/v1/rpc/ethereum/mainnet \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${docsConfig.apiKeyPrefix}YOUR_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getBlockByNumber",
    "params": ["latest", false],
    "id": 1
  }'`}
              />
              <CodeBlock
                title="Response"
                code={`{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": "0x134a3c7",
    "hash": "0x8b3e...",
    "timestamp": "0x6798a1b3",
    "transactions": [...],
    "gasUsed": "0x1c9c380",
    "baseFeePerGas": "0x5f5e100"
  }
}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Supported Chains */}
      <section className="border-b py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Every chain your users need
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {brand.name} supports all major EVM and non-EVM chains. Access
              mainnets and testnets through the same API key.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[
              "Ethereum",
              "Solana",
              "Base",
              "Arbitrum",
              "Optimism",
              "Polygon",
              "BNB Chain",
              "Avalanche",
              "Fantom",
              "Lux",
              "zkSync",
              "Scroll",
              "Linea",
              "Mantle",
              "Blast",
              "Mode",
              "Celo",
              "Gnosis",
            ].map((chain) => (
              <Card
                key={chain}
                className="flex items-center justify-center p-4 text-center text-sm font-medium"
              >
                {chain}
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/chains">
                View All 100+ Chains
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-20 sm:px-12 sm:py-28">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:14px_24px]" />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Start querying in under 30 seconds
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Create a free account, grab your API key, and make your first
                RPC call. No credit card required. 100M compute units per month
                on the free plan.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="xl"
                  className="bg-white text-blue-600 hover:bg-white/90"
                  asChild
                >
                  <Link href="/dashboard">
                    Get Your Free API Key
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/contact">Contact Sales</Link>
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

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold md:text-3xl">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
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
