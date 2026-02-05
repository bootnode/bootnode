"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Book,
  Zap,
  Globe,
  Webhook,
  Wallet,
  Fuel,
  Code,
  Terminal,
  FileCode,
  ArrowRight,
} from "lucide-react"
import { docsConfig } from "@/lib/docs-config"

const sections = [
  {
    title: "Getting Started",
    description: "Quick start guides and tutorials",
    icon: Zap,
    items: [
      { name: "Introduction", href: "/docs/intro" },
      { name: "Authentication", href: "/docs/auth" },
      { name: "Making Requests", href: "/docs/requests" },
      { name: "ZAP Protocol", href: "/docs/zap/quickstart" },
    ],
  },
  {
    title: "Node API",
    description: "JSON-RPC and REST endpoints for all chains",
    icon: Globe,
    items: [
      { name: "Overview", href: "/docs/node" },
      { name: "Ethereum", href: "/docs/node/ethereum" },
      { name: "Solana", href: "/docs/node/solana" },
      { name: "All Chains", href: "/docs/node/chains" },
    ],
  },
  {
    title: "Data API",
    description: "Indexed blockchain data for analytics",
    icon: FileCode,
    items: [
      { name: "Blocks", href: "/docs/data/blocks" },
      { name: "Transactions", href: "/docs/data/transactions" },
      { name: "Tokens", href: "/docs/data/tokens" },
      { name: "NFTs", href: "/docs/data/nfts" },
    ],
  },
  {
    title: "Webhooks",
    description: "Real-time event notifications",
    icon: Webhook,
    items: [
      { name: "Setup", href: "/docs/webhooks/setup" },
      { name: "Events", href: "/docs/webhooks/events" },
      { name: "Signatures", href: "/docs/webhooks/signatures" },
      { name: "Retries", href: "/docs/webhooks/retries" },
    ],
  },
  {
    title: "Smart Wallets",
    description: "ERC-4337 account abstraction",
    icon: Wallet,
    items: [
      { name: "Overview", href: "/docs/wallets" },
      { name: "Creating Wallets", href: "/docs/wallets/create" },
      { name: "User Operations", href: "/docs/wallets/userops" },
      { name: "Session Keys", href: "/docs/wallets/sessions" },
    ],
  },
  {
    title: "Gas Manager",
    description: "Gas sponsorship and paymasters",
    icon: Fuel,
    items: [
      { name: "Policies", href: "/docs/gas/policies" },
      { name: "Paymasters", href: "/docs/gas/paymasters" },
      { name: "Sponsorship", href: "/docs/gas/sponsorship" },
      { name: "Limits", href: "/docs/gas/limits" },
    ],
  },
  {
    title: "ZAP Protocol",
    description: "Native binary RPC for AI agents",
    icon: Zap,
    items: [
      { name: "Quickstart", href: "/docs/zap/quickstart" },
      { name: "Schema", href: "/docs/zap/quickstart#schema" },
      { name: "Tools", href: "/docs/zap/quickstart#available-tools" },
      { name: "Resources", href: "/docs/zap/quickstart#available-resources" },
    ],
  },
]

const sdks = [
  { name: "TypeScript", badge: "v2.0", href: "/docs/sdk/typescript" },
  { name: "Python", badge: "v2.0", href: "/docs/sdk/python" },
  { name: "Go", badge: "v1.0", href: "/docs/sdk/go" },
  { name: "Rust", badge: "v0.9", href: "/docs/sdk/rust" },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container py-12">
          <div className="flex items-center gap-3 mb-4">
            <Book className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Documentation</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Everything you need to build blockchain applications with {docsConfig.brandName}.
            Multi-chain RPC, indexed data, webhooks, smart wallets, and more.
          </p>
        </div>
      </div>

      <div className="container py-12">
        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-4 mb-12">
          <Link
            href="/docs/quickstart"
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-primary" />
              <span className="font-medium">Quick Start</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/api"
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Code className="h-5 w-5 text-primary" />
              <span className="font-medium">API Reference</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/examples"
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileCode className="h-5 w-5 text-primary" />
              <span className="font-medium">Examples</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/changelog"
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-medium">Changelog</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* SDKs */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>SDKs & Libraries</CardTitle>
            <CardDescription>
              Official client libraries for your favorite languages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {sdks.map((sdk) => (
                <Link
                  key={sdk.name}
                  href={sdk.href}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="font-medium">{sdk.name}</span>
                  <Badge variant="secondary">{sdk.badge}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documentation Sections */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <section.icon className="h-6 w-6 text-primary" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Reference Preview */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>API Reference</CardTitle>
            <CardDescription>
              Complete reference for all {docsConfig.brandName} APIs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { method: "POST", path: "/v1/rpc/{chain}", desc: "JSON-RPC proxy" },
                { method: "GET", path: "/v1/tokens/{chain}", desc: "Token balances" },
                { method: "GET", path: "/v1/nfts/{chain}", desc: "NFT collections" },
                { method: "GET", path: "/v1/transactions/{chain}", desc: "Transaction history" },
                { method: "POST", path: "/v1/webhooks", desc: "Create webhook" },
                { method: "POST", path: "/v1/wallets/deploy", desc: "Deploy smart wallet" },
              ].map((endpoint) => (
                <div
                  key={endpoint.path}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <Badge
                    variant={endpoint.method === "POST" ? "default" : "secondary"}
                    className="font-mono"
                  >
                    {endpoint.method}
                  </Badge>
                  <div>
                    <code className="text-sm">{endpoint.path}</code>
                    <p className="text-xs text-muted-foreground">{endpoint.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
