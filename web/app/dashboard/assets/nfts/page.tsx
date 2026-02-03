"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Image, Search, ExternalLink, Loader2 } from "lucide-react"

interface NFT {
  contract: string
  tokenId: string
  name?: string
  image?: string
  chain: string
}

export default function NFTsPage() {
  const [address, setAddress] = useState("")
  const [chain, setChain] = useState("ethereum")
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("bootnode_token")
    const apiKey = localStorage.getItem("bootnode_api_key")
    if (token) return { "Authorization": `Bearer ${token}` }
    if (apiKey) return { "X-API-Key": apiKey }
    return {}
  }

  async function searchNFTs() {
    if (!address.trim()) return
    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/v1/nfts/${chain}/owned/${address}`,
        { headers: getAuthHeaders() }
      )
      if (res.ok) {
        const data = await res.json()
        setNfts(Array.isArray(data) ? data : data.nfts || [])
      } else {
        setNfts([])
      }
    } catch (e) {
      console.error("Failed to fetch NFTs:", e)
      setNfts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">NFTs</h1>
        <p className="text-muted-foreground">
          Browse NFT collections and ownership
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search NFTs</CardTitle>
          <CardDescription>
            Enter a wallet address to view owned NFTs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
              <option value="base">Base</option>
            </select>
            <Input
              placeholder="Enter wallet address (0x...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1"
            />
            <Button onClick={searchNFTs} disabled={loading || !address.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : searched ? (
        nfts.length === 0 ? (
          <Card>
            <CardContent className="text-center p-12 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No NFTs found</p>
              <p className="text-sm">This address has no NFTs on {chain}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {nfts.map((nft, idx) => (
              <Card key={`${nft.contract}-${nft.tokenId}-${idx}`} className="overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  {nft.image ? (
                    <img
                      src={nft.image}
                      alt={nft.name || `NFT #${nft.tokenId}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{nft.name || `Token #${nft.tokenId}`}</h3>
                  <p className="text-sm text-muted-foreground truncate font-mono">
                    {nft.contract.slice(0, 6)}...{nft.contract.slice(-4)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline">{chain}</Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={`https://opensea.io/assets/${chain}/${nft.contract}/${nft.tokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardContent className="text-center p-12 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Search for NFTs</p>
            <p className="text-sm">Enter a wallet address above to browse NFT holdings</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>NFT API Endpoints</CardTitle>
          <CardDescription>Available endpoints for NFT data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { method: "GET", path: "/v1/nfts/{chain}/owned/{address}", description: "Get owned NFTs" },
              { method: "GET", path: "/v1/nfts/{chain}/collection/{contract}", description: "Get collection info" },
              { method: "GET", path: "/v1/nfts/{chain}/metadata/{contract}/{tokenId}", description: "Get NFT metadata" },
              { method: "POST", path: "/v1/nfts/{chain}/refresh/{contract}/{tokenId}", description: "Refresh metadata" },
            ].map((endpoint) => (
              <div key={endpoint.path} className="flex items-center gap-3 p-3 border rounded-lg">
                <Badge variant="default" className="font-mono text-xs w-12 justify-center">
                  {endpoint.method}
                </Badge>
                <code className="text-sm font-mono flex-1">{endpoint.path}</code>
                <span className="text-sm text-muted-foreground">{endpoint.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
