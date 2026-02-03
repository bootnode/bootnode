"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  TrendingUp, TrendingDown, Server, Coins, Search, ArrowUpRight,
  Loader2, Filter, ChevronRight, Zap, Shield, Globe, Star, Lock
} from "lucide-react"
import Link from "next/link"

interface StakingData {
  apy: number
  apy_change_7d: number
  staking_ratio: number
  staked_tokens: number
  staked_tokens_change_7d: number
  tvl: number
  tvl_change_7d: number
  validator_fee: number
  min_stake: number
  unbonding_days: number
}

interface ScoreBreakdown {
  market_score: number
  staking_score: number
  security_score: number
  adoption_score: number
  tech_score: number
}

interface MarketAsset {
  chain: string
  name: string
  symbol: string
  image: string
  price: number
  price_change_24h: number
  price_change_7d: number
  market_cap: number
  market_cap_rank: number
  volume_24h: number
  circulating_supply: number
  ath: number
  ath_change_percentage: number
  apy: number
  staking_ratio: number
  staked_tokens: number
  tvl: number
  validator_fee: number
  score: number
  score_breakdown: ScoreBreakdown
  supported: boolean
  has_validator: boolean
  has_mev: boolean
}

export default function MarketsPage() {
  const [assets, setAssets] = useState<MarketAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "high_yield" | "top_mcap" | "supported">("all")
  const [sortBy, setSortBy] = useState<"score" | "apy" | "tvl" | "market_cap">("score")

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("bootnode_token")
    const apiKey = localStorage.getItem("bootnode_api_key")
    if (token) return { "Authorization": `Bearer ${token}` }
    if (apiKey) return { "X-API-Key": apiKey }
    return {}
  }

  async function fetchMarketData() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/v1/nodes/staking`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const data = await res.json()
        setAssets(data.chains || [])
      }
    } catch (e) {
      console.error("Failed to fetch market data:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const filteredAssets = assets
    .filter(asset => {
      const matchesSearch = asset.chain.toLowerCase().includes(search.toLowerCase()) ||
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      switch (filter) {
        case "high_yield":
          return asset.apy >= 10
        case "top_mcap":
          return asset.market_cap >= 1e9
        case "supported":
          return asset.supported
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "apy": return (b.apy || 0) - (a.apy || 0)
        case "tvl": return (b.tvl || 0) - (a.tvl || 0)
        case "market_cap": return (b.market_cap || 0) - (a.market_cap || 0)
        default: return (b.score || 0) - (a.score || 0)
      }
    })

  const totalTVL = assets.reduce((acc, c) => acc + (c.tvl || 0), 0)
  const totalMarketCap = assets.reduce((acc, c) => acc + (c.market_cap || 0), 0)
  const avgAPY = assets.length > 0
    ? assets.filter(c => c.apy > 0).reduce((acc, c) => acc + c.apy, 0) / assets.filter(c => c.apy > 0).length
    : 0

  const formatValue = (value: number, decimals = 2) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(decimals)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(decimals)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(decimals)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(decimals)}K`
    return `$${value.toFixed(decimals)}`
  }

  const formatTokens = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
    return value.toFixed(2)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Markets & Staking</h1>
          <p className="text-muted-foreground">
            Real-time staking rewards, TVL, and market data for {assets.length}+ networks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMarketData}>
            <Loader2 className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard/infrastructure/nodes">
              <Server className="mr-2 h-4 w-4" />
              Deploy Node
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" /> Total Value Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : formatValue(totalTVL)}</div>
            <p className="text-xs text-muted-foreground">Staked across networks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" /> Total Market Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : formatValue(totalMarketCap)}</div>
            <p className="text-xs text-muted-foreground">Combined value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Average APY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {loading ? "..." : `${avgAPY.toFixed(2)}%`}
            </div>
            <p className="text-xs text-muted-foreground">Mean reward rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" /> High Yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : assets.filter(c => c.apy >= 10).length}
            </div>
            <p className="text-xs text-muted-foreground">10%+ APY chains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" /> Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : assets.filter(c => c.supported).length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to deploy</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Opportunities */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Top Rated Staking Networks
          </CardTitle>
          <CardDescription>Based on market position, yield, security, and adoption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {assets
              .filter(c => c.supported && c.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((asset, idx) => (
                <Link
                  key={asset.chain}
                  href={`/dashboard/infrastructure/nodes?chain=${asset.chain}`}
                  className="flex flex-col items-center p-4 rounded-lg bg-background hover:bg-muted transition-colors border relative"
                >
                  <Badge className="absolute -top-2 -right-2 bg-yellow-500">#{idx + 1}</Badge>
                  {asset.image ? (
                    <img src={asset.image} alt={asset.name} className="w-10 h-10 rounded-full mb-2" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                      <Coins className="h-5 w-5" />
                    </div>
                  )}
                  <span className="font-medium text-sm">{asset.name}</span>
                  <span className={`text-lg font-bold ${getScoreColor(asset.score)}`}>{asset.score.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground">Score</span>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="text-green-500">{asset.apy}% APY</span>
                  </div>
                </Link>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Search, Filter, and Sort */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, symbol, or chain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "supported" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("supported")}
          >
            <Server className="mr-1 h-3 w-3" />
            Supported
          </Button>
          <Button
            variant={filter === "high_yield" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("high_yield")}
          >
            <TrendingUp className="mr-1 h-3 w-3" />
            10%+ APY
          </Button>
          <Button
            variant={filter === "top_mcap" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("top_mcap")}
          >
            <Coins className="mr-1 h-3 w-3" />
            $1B+ TVL
          </Button>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="score">Sort by Score</option>
          <option value="apy">Sort by APY</option>
          <option value="tvl">Sort by TVL</option>
          <option value="market_cap">Sort by Market Cap</option>
        </select>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staking Networks</CardTitle>
          <CardDescription>
            {filteredAssets.length} networks • Live data from CoinGecko
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs">
                    <th className="py-3 px-2 font-medium text-muted-foreground">#</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground">Asset</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground text-right">Price</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground text-right">7d</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground text-right">APY</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground text-right">Fee</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground text-right">Staked</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground text-right">TVL</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground text-center">Score</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset, idx) => (
                    <tr
                      key={asset.chain}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-2 text-muted-foreground text-sm">{idx + 1}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {asset.image ? (
                            <img src={asset.image} alt={asset.name} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <Coins className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{asset.name}</p>
                            <p className="text-xs text-muted-foreground">{asset.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        ${asset.price?.toLocaleString(undefined, { maximumFractionDigits: 4 }) || "-"}
                      </td>
                      <td className="py-3 px-2 text-right text-sm">
                        {asset.price_change_7d !== undefined && asset.price_change_7d !== 0 && (
                          <span className={asset.price_change_7d >= 0 ? "text-green-500" : "text-red-500"}>
                            {asset.price_change_7d >= 0 ? "+" : ""}{asset.price_change_7d.toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-bold text-sm ${asset.apy >= 10 ? "text-green-500" : asset.apy >= 5 ? "text-yellow-500" : ""}`}>
                          {asset.apy > 0 ? `${asset.apy.toFixed(2)}%` : "-"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-sm text-muted-foreground">
                        {asset.validator_fee > 0 ? `${asset.validator_fee}%` : "-"}
                      </td>
                      <td className="py-3 px-2 text-right text-sm">
                        <div>
                          <p>{asset.staked_tokens > 0 ? formatTokens(asset.staked_tokens) : "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {asset.staking_ratio > 0 ? `${asset.staking_ratio.toFixed(1)}%` : ""}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {asset.tvl > 0 ? formatValue(asset.tvl, 1) : "-"}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className={`font-bold text-lg ${getScoreColor(asset.score || 0)}`}>
                          {asset.score > 0 ? asset.score.toFixed(0) : "-"}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          {asset.has_validator && <Badge variant="secondary" className="text-xs">Val</Badge>}
                          {asset.has_mev && <Badge className="text-xs bg-purple-500">MEV</Badge>}
                          {asset.supported && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/infrastructure/nodes?chain=${asset.chain}`}>
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>How We Score Networks</CardTitle>
          <CardDescription>Our scoring algorithm evaluates networks across 5 dimensions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4" />
                <span className="font-medium">Market (25pts)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Market cap ranking and liquidity depth
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Staking (25pts)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                APY attractiveness and network participation
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Security (20pts)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Network maturity and economic security
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4" />
                <span className="font-medium">Adoption (15pts)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Trading volume and usage metrics
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Tech (15pts)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Price strength vs ATH and momentum
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
