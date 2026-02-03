"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Wallet,
  Copy,
  ExternalLink,
  Check,
  Loader2,
  X,
  Shield,
  Key,
  Users,
} from "lucide-react"
import { useWallets, useCreateWallet } from "@/lib/hooks"

export default function WalletsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [ownerAddress, setOwnerAddress] = useState("")
  const [chain, setChain] = useState("ethereum")
  const [network, setNetwork] = useState("mainnet")
  const [salt, setSalt] = useState("")
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null)

  const walletsQuery = useWallets()
  const createWallet = useCreateWallet()

  const wallets = Array.isArray(walletsQuery.data) ? walletsQuery.data : []

  async function handleCreate() {
    if (!ownerAddress.trim() || !chain.trim()) return
    try {
      await createWallet.mutateAsync({
        owner_address: ownerAddress.trim(),
        chain: chain.trim(),
        network: network.trim() || undefined,
        salt: salt.trim() || undefined,
      })
      setOwnerAddress("")
      setChain("ethereum")
      setNetwork("mainnet")
      setSalt("")
      setShowCreate(false)
    } catch {
      // error available via createWallet.error
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedAddr(text)
    setTimeout(() => setCopiedAddr(null), 2000)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Wallets</h1>
          <p className="text-muted-foreground">
            Deploy and manage ERC-4337 smart accounts
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Deploy Wallet
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Deploy New Smart Wallet</CardTitle>
            <CardDescription>Create an ERC-4337 smart account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Owner Address</label>
                <Input
                  placeholder="0x..."
                  value={ownerAddress}
                  onChange={(e) => setOwnerAddress(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Chain</label>
                <Input
                  placeholder="ethereum, base, polygon..."
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Network</label>
                <Input
                  placeholder="mainnet, testnet, sepolia..."
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Salt (optional)</label>
                <Input
                  placeholder="Custom deployment salt"
                  value={salt}
                  onChange={(e) => setSalt(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            {createWallet.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {String(createWallet.error)}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createWallet.isPending || !ownerAddress.trim()}>
                {createWallet.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deploy Wallet
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {walletsQuery.isLoading ? "..." : wallets.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={walletsQuery.error ? "destructive" : "default"}>
              {walletsQuery.isLoading ? "Loading" : walletsQuery.error ? "Error" : "Connected"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">UserOps / Gas Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Connect analytics to track</p>
          </CardContent>
        </Card>
      </div>

      {/* Wallets List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Wallets</CardTitle>
          <CardDescription>
            Smart accounts deployed through Bootnode
          </CardDescription>
        </CardHeader>
        <CardContent>
          {walletsQuery.isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-muted-foreground">Loading wallets...</div>
            </div>
          ) : walletsQuery.error ? (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
              {String(walletsQuery.error)}
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center text-muted-foreground p-12">
              No wallets yet. Deploy your first smart wallet above.
            </div>
          ) : (
            <div className="space-y-4">
              {wallets.map((wallet: { address?: string; owner_address?: string; chain?: string; network?: string; is_deployed?: boolean; counterfactual_address?: string; created_at?: string }, i: number) => {
                const addr = wallet.address || wallet.counterfactual_address || ""
                return (
                  <div
                    key={addr || i}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{wallet.chain || "unknown"}</Badge>
                          <Badge variant="secondary">{wallet.network || "mainnet"}</Badge>
                          <Badge variant={wallet.is_deployed ? "default" : "outline"}>
                            {wallet.is_deployed ? "Deployed" : "Counterfactual"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm text-muted-foreground font-mono">
                            {addr ? `${addr.slice(0, 10)}...${addr.slice(-8)}` : "N/A"}
                          </code>
                          {addr && (
                            <button
                              onClick={() => handleCopy(addr)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {copiedAddr === addr ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                        {wallet.owner_address && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Owner: {wallet.owner_address.slice(0, 10)}...{wallet.owner_address.slice(-6)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {wallet.created_at && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="text-xs">{new Date(wallet.created_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Wallet Features</CardTitle>
          <CardDescription>
            Advanced capabilities for your smart accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, name: "Account Abstraction", description: "ERC-4337 smart accounts with gasless transactions" },
              { icon: Users, name: "Multisig Support", description: "Multi-signature wallets for enhanced security" },
              { icon: Key, name: "Session Keys", description: "Temporary permissions for dApps" },
              { icon: Wallet, name: "Batch Transactions", description: "Execute multiple operations atomically" },
            ].map((feature) => (
              <div key={feature.name} className="p-4 border rounded-lg">
                <feature.icon className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-medium">{feature.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
