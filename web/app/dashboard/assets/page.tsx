"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, Image, Wallet } from "lucide-react"
import Link from "next/link"

export default function AssetsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Assets</h1>
        <p className="text-muted-foreground">
          Manage tokens, NFTs, and digital assets
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Tokens
            </CardTitle>
            <CardDescription>
              ERC-20 token management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Query token balances, metadata, and transfers
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/assets/tokens">
                Manage Tokens
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              NFTs
            </CardTitle>
            <CardDescription>
              ERC-721/1155 collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse NFT collections, ownership, and metadata
            </p>
            <Button variant="outline" className="w-full">
              Browse NFTs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Portfolios
            </CardTitle>
            <CardDescription>
              Track wallet holdings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View aggregated portfolio across chains
            </p>
            <Button variant="outline" className="w-full">
              View Portfolios
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset APIs</CardTitle>
          <CardDescription>
            Available endpoints for asset management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { method: "GET", path: "/v1/tokens/{chain}/balances/{address}", description: "Get token balances" },
              { method: "GET", path: "/v1/tokens/{chain}/metadata/{contract}", description: "Get token metadata" },
              { method: "GET", path: "/v1/nfts/{chain}/owned/{address}", description: "Get owned NFTs" },
              { method: "GET", path: "/v1/nfts/{chain}/metadata/{contract}/{tokenId}", description: "Get NFT metadata" },
              { method: "POST", path: "/v1/nfts/{chain}/refresh/{contract}/{tokenId}", description: "Refresh NFT metadata" },
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
