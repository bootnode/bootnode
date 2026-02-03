"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  CHAINS,
  CHAIN_CATEGORIES,
  type Chain,
  type ChainCategory,
} from "@/lib/chains"
import {
  ArrowRight,
  Globe,
  Search,
  Zap,
} from "lucide-react"

const CATEGORY_ORDER: ChainCategory[] = [
  "ethereum-l1",
  "layer-2",
  "alt-l1",
  "bitcoin",
  "other",
]

export default function ChainsPage() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const filtered = useMemo(() => {
    let result = CHAINS.filter((c) => !c.deprecated)

    if (activeCategory !== "all") {
      result = result.filter((c) => c.category === activeCategory)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.features.some((f) => f.toLowerCase().includes(q))
      )
    }

    return result
  }, [query, activeCategory])

  const grouped = useMemo(() => {
    if (activeCategory !== "all") {
      return [{ category: activeCategory as ChainCategory, chains: filtered }]
    }
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      chains: filtered.filter((c) => c.category === cat),
    })).filter((g) => g.chains.length > 0)
  }, [filtered, activeCategory])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="container relative py-20 md:py-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Badge variant="secondary" className="mb-4">
              <Globe className="mr-1 h-3 w-3" />
              Multi-Chain Infrastructure
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              100+ Chains,{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                One API
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Access every major blockchain through a unified interface. High-performance
              RPC, indexed data APIs, WebSockets, and more across all supported networks.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="border-b bg-muted/30 py-6">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search chains..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("all")}
              >
                All Chains
              </Button>
              {CATEGORY_ORDER.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                >
                  {CHAIN_CATEGORIES[cat].name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Chain Grid */}
      <section className="py-16">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">
                No chains found matching &quot;{query}&quot;.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setQuery("")
                  setActiveCategory("all")
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="space-y-16">
              {grouped.map(({ category, chains }) => (
                <div key={category}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {CHAIN_CATEGORIES[category].name}
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      {CHAIN_CATEGORIES[category].description}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {chains.map((chain) => (
                      <ChainCard key={chain.id} chain={chain} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <p className="text-muted-foreground">
              Don&apos;t see the chain you need?
            </p>
            <Button variant="outline" size="lg" className="mt-4" asChild>
              <Link href="/contact">
                Request a Chain
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Zap className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">
              Start building on any chain
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get 100M compute units free every month. No credit card required.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function ChainCard({ chain }: { chain: Chain }) {
  const mainnet = chain.networks.find((n) => !n.isTestnet)
  const testnets = chain.networks.filter((n) => n.isTestnet)

  return (
    <Link href={`/chains/${chain.slug}`}>
      <Card className="group h-full transition-colors hover:border-foreground/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: chain.color || "#6366f1" }}
              >
                {chain.name.charAt(0)}
              </div>
              <div>
                <CardTitle className="text-base">{chain.name}</CardTitle>
                {mainnet?.chainId && (
                  <p className="text-xs text-muted-foreground">
                    Chain ID: {mainnet.chainId}
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant={chain.type === "evm" ? "secondary" : "outline"}
              className="text-[10px] uppercase"
            >
              {chain.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {chain.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {mainnet && (
              <Badge variant="success" className="text-[10px]">
                Mainnet
              </Badge>
            )}
            {testnets.map((t) => (
              <Badge key={t.id} variant="secondary" className="text-[10px]">
                {t.name}
              </Badge>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {chain.features.slice(0, 3).map((f) => (
              <span
                key={f}
                className="text-[10px] text-muted-foreground"
              >
                {f}
                {chain.features.indexOf(f) < Math.min(chain.features.length, 3) - 1 && " · "}
              </span>
            ))}
          </div>
          <span className="mt-3 inline-flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View details
            <ArrowRight className="ml-1 h-3 w-3" />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}
