"use client"

import { Badge } from "@/components/ui/badge"
import { CHAINS, type Chain } from "@/lib/chains"

const FEATURED_CHAINS = [
  "ethereum",
  "solana",
  "base",
  "arbitrum",
  "polygon",
  "optimism",
  "avalanche",
  "bnb",
  "zksync",
  "starknet",
  "scroll",
  "linea",
  "blast",
  "berachain",
  "monad",
  "lux",
]

export function ChainGrid() {
  const featuredChains = FEATURED_CHAINS.map((id) =>
    CHAINS.find((c) => c.id === id)
  ).filter(Boolean) as Chain[]

  return (
    <div className="mt-12 grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
      {featuredChains.map((chain) => (
        <ChainTile key={chain.id} chain={chain} />
      ))}
    </div>
  )
}

function ChainTile({ chain }: { chain: Chain }) {
  return (
    <div
      className="group flex flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20"
      title={chain.description}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-2xl font-bold text-white"
        style={{ backgroundColor: chain.color || "#6366f1" }}
      >
        {chain.name.charAt(0)}
      </div>
      <span className="text-center text-xs font-medium">{chain.name}</span>
      {chain.networks.some((n) => n.isTestnet) && (
        <Badge variant="secondary" className="text-[10px]">
          +testnet
        </Badge>
      )}
    </div>
  )
}
