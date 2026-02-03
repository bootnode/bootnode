import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CHAINS, getChainBySlug } from "@/lib/chains"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  Globe,
  Network,
  Zap,
} from "lucide-react"

const CHAIN_EXPLORERS: Record<string, string> = {
  ethereum: "https://etherscan.io",
  solana: "https://explorer.solana.com",
  base: "https://basescan.org",
  arbitrum: "https://arbiscan.io",
  polygon: "https://polygonscan.com",
  optimism: "https://optimistic.etherscan.io",
  avalanche: "https://snowtrace.io",
  bnb: "https://bscscan.com",
  lux: "https://explore.lux.network",
}

const CHAIN_APIS: Record<string, string[]> = {
  ethereum: ["JSON-RPC", "WebSocket", "Beacon API", "Token API", "NFT API", "Transfers API", "Webhooks", "Debug & Trace", "Archive Nodes"],
  solana: ["JSON-RPC", "WebSocket", "DAS API", "Token API", "NFT API", "Transfers API", "Webhooks"],
  base: ["JSON-RPC", "WebSocket", "Token API", "NFT API", "Transfers API", "Webhooks", "Debug & Trace", "Flashblocks API"],
  arbitrum: ["JSON-RPC", "WebSocket", "Token API", "NFT API", "Transfers API", "Webhooks", "Debug & Trace", "Stylus Support"],
  polygon: ["JSON-RPC", "WebSocket", "Token API", "NFT API", "Transfers API", "Webhooks", "Debug & Trace"],
  optimism: ["JSON-RPC", "WebSocket", "Token API", "NFT API", "Transfers API", "Webhooks", "Debug & Trace", "Flashblocks API"],
  avalanche: ["JSON-RPC", "WebSocket", "Token API", "NFT API", "Transfers API", "Webhooks", "Subnet Support"],
  bnb: ["JSON-RPC", "WebSocket", "Token API", "NFT API", "Transfers API", "Webhooks", "Debug & Trace"],
  lux: ["JSON-RPC", "WebSocket", "Token API", "NFT API", "Transfers API", "Webhooks", "Multi-Consensus API", "Post-Quantum Signing"],
}

export function generateStaticParams() {
  return [
    { slug: "ethereum" },
    { slug: "solana" },
    { slug: "base" },
    { slug: "arbitrum" },
    { slug: "polygon" },
    { slug: "optimism" },
    { slug: "avalanche" },
    { slug: "bnb-smart-chain" },
    { slug: "lux" },
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const chain = getChainBySlug(slug)
  if (!chain) return { title: "Chain Not Found" }
  return {
    title: `${chain.name} - RPC & APIs`,
    description: `Access ${chain.name} with Bootnode's high-performance RPC endpoints, Token APIs, NFT APIs, WebSockets, and more. 99.999% uptime guaranteed.`,
  }
}

export default async function ChainDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const chain = getChainBySlug(slug)

  if (!chain) {
    notFound()
  }

  const explorer = CHAIN_EXPLORERS[chain.id] || "#"
  const apis = CHAIN_APIS[chain.id] || ["JSON-RPC", "WebSocket", "Token API", "NFT API", "Transfers API", "Webhooks"]
  const mainnet = chain.networks.find((n) => !n.isTestnet)
  const testnets = chain.networks.filter((n) => n.isTestnet)

  const rpcEndpoint = chain.type === "svm"
    ? `https://${chain.slug}.mainnet.rpc.bootnode.dev`
    : `https://${chain.slug}-mainnet.rpc.bootnode.dev`

  const curlExample = chain.type === "svm"
    ? `curl -X POST ${rpcEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getSlot",
    "params": []
  }'`
    : `curl -X POST ${rpcEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_blockNumber",
    "params": []
  }'`

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container py-16 md:py-20">
          <Link
            href="/chains"
            className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            All Chains
          </Link>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                style={{ backgroundColor: chain.color || "#6366f1" }}
              >
                {chain.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {chain.name}
                  </h1>
                  <Badge
                    variant={chain.type === "evm" ? "secondary" : "outline"}
                    className="uppercase"
                  >
                    {chain.type}
                  </Badge>
                </div>
                <p className="mt-2 max-w-xl text-lg text-muted-foreground">
                  {chain.description}
                </p>
                {mainnet?.chainId && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chain ID: {mainnet.chainId}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/dashboard">
                  Get API Key
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {chain.docs?.quickstart && (
                <Button variant="outline" asChild>
                  <Link href={chain.docs.quickstart}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Documentation
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Networks */}
      <section className="border-b py-16">
        <div className="container">
          <h2 className="text-2xl font-bold tracking-tight">Networks</h2>
          <p className="mt-2 text-muted-foreground">
            Available networks for {chain.name}. Use mainnet for production and testnets for development.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mainnet && (
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{mainnet.name}</CardTitle>
                    </div>
                    <Badge variant="success">Production</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {mainnet.chainId && (
                    <p className="text-sm text-muted-foreground">
                      Chain ID: <code className="rounded bg-muted px-1 font-mono text-xs">{mainnet.chainId}</code>
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    RPC: <code className="rounded bg-muted px-1 font-mono text-xs break-all">{rpcEndpoint}</code>
                  </p>
                  <div className="mt-3 flex gap-2">
                    {explorer !== "#" && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={explorer} target="_blank" rel="noopener noreferrer">
                          Explorer
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {testnets.map((testnet) => (
              <Card key={testnet.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{testnet.name}</CardTitle>
                    </div>
                    <Badge variant="warning">Testnet</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {testnet.chainId && (
                    <p className="text-sm text-muted-foreground">
                      Chain ID: <code className="rounded bg-muted px-1 font-mono text-xs">{testnet.chainId}</code>
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    RPC: <code className="rounded bg-muted px-1 font-mono text-xs break-all">
                      {chain.type === "svm"
                        ? `https://${chain.slug}.devnet.rpc.bootnode.dev`
                        : `https://${chain.slug}-${testnet.id}.rpc.bootnode.dev`}
                    </code>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features & APIs */}
      <section className="border-b bg-muted/30 py-16">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Supported APIs</h2>
              <p className="mt-2 text-muted-foreground">
                Everything you need to build on {chain.name}, available through a single API key.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {apis.map((api) => (
                  <div key={api} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{api}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Chain Features</h2>
              <p className="mt-2 text-muted-foreground">
                Key capabilities and characteristics of {chain.name}.
              </p>
              <div className="mt-8 space-y-3">
                {chain.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 rounded-lg border bg-card p-3"
                  >
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="border-b py-16">
        <div className="container">
          <h2 className="text-2xl font-bold tracking-tight">Quick Start</h2>
          <p className="mt-2 text-muted-foreground">
            Send your first request to {chain.name} in under a minute.
          </p>
          <div className="mt-8">
            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">cURL</span>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {chain.type === "svm" ? "getSlot" : "eth_blockNumber"}
                </Badge>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-sm text-muted-foreground">
                <code>{curlExample}</code>
              </pre>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button asChild>
              <Link href="/dashboard">
                Get Your API Key
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {chain.docs?.quickstart && (
              <Button variant="outline" asChild>
                <Link href={chain.docs.quickstart}>View Full Guide</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b bg-muted/30 py-16">
        <div className="container">
          <h2 className="text-2xl font-bold tracking-tight">Pricing</h2>
          <p className="mt-2 text-muted-foreground">
            {chain.name} is included in all Bootnode plans. Start free and scale as you grow.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Free</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="mt-2 text-sm text-muted-foreground">100M compute units per month. Perfect for getting started.</p>
              </CardContent>
            </Card>
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Growth</CardTitle>
                  <Badge>Popular</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">$99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="mt-2 text-sm text-muted-foreground">1B compute units per month. All chains and APIs included.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enterprise</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Custom</p>
                <p className="mt-2 text-sm text-muted-foreground">Dedicated infrastructure with 99.999% SLA and 24/7 support.</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <Link href="/pricing">
                View Full Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* Other chains */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-bold tracking-tight">Explore More Chains</h2>
          <p className="mt-2 text-muted-foreground">
            Bootnode supports 100+ blockchains. Here are some popular ones.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-9">
            {CHAINS.filter((c) => !c.deprecated && c.id !== chain.id)
              .slice(0, 9)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/chains/${c.slug}`}
                  className="flex flex-col items-center gap-2 rounded-lg border bg-card p-3 transition-colors hover:border-foreground/20"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: c.color || "#6366f1" }}
                  >
                    {c.name.charAt(0)}
                  </div>
                  <span className="text-center text-xs font-medium">{c.name}</span>
                </Link>
              ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/chains">
                View All Chains
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
