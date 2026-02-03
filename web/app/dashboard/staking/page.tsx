"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Wallet, Key, Shield, Server, Coins, Lock, Unlock, ExternalLink,
  Loader2, ChevronRight, Zap, AlertTriangle, Check, Copy, RefreshCcw
} from "lucide-react"
import Link from "next/link"

interface Validator {
  id: string
  chain: string
  address: string
  stake: number
  rewards: number
  status: "active" | "pending" | "inactive"
  uptime: number
  commission: number
}

interface WalletState {
  connected: boolean
  address: string | null
  chain: string | null
  balance: number
  kmsConfigured: boolean
}

export default function StakingPage() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    chain: null,
    balance: 0,
    kmsConfigured: false,
  })
  const [validators, setValidators] = useState<Validator[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("bootnode_token")
    const apiKey = localStorage.getItem("bootnode_api_key")
    if (token) return { "Authorization": `Bearer ${token}` }
    if (apiKey) return { "X-API-Key": apiKey }
    return {}
  }

  async function connectWallet(type: "metamask" | "ledger" | "kms") {
    setLoading(true)
    try {
      if (type === "metamask") {
        // MetaMask/EIP-1193 connection
        if (typeof window !== "undefined" && (window as any).ethereum) {
          const accounts = await (window as any).ethereum.request({
            method: "eth_requestAccounts",
          })
          if (accounts.length > 0) {
            const chainId = await (window as any).ethereum.request({
              method: "eth_chainId",
            })
            const balance = await (window as any).ethereum.request({
              method: "eth_getBalance",
              params: [accounts[0], "latest"],
            })
            setWallet({
              connected: true,
              address: accounts[0],
              chain: parseInt(chainId, 16) === 1 ? "ethereum" : `chain-${parseInt(chainId, 16)}`,
              balance: parseInt(balance, 16) / 1e18,
              kmsConfigured: false,
            })
          }
        }
      } else if (type === "ledger") {
        // Ledger connection would use @ledgerhq/hw-transport-webusb
        alert("Ledger connection requires hardware wallet. Please connect your Ledger device.")
      } else if (type === "kms") {
        // Check if KMS (Hanzo KSM) is configured
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/v1/keys/status`,
          { headers: getAuthHeaders() }
        )
        if (res.ok) {
          const data = await res.json()
          setWallet({
            connected: true,
            address: data.default_address || "KMS Managed",
            chain: data.default_chain || "multi-chain",
            balance: data.total_balance || 0,
            kmsConfigured: true,
          })
        } else {
          alert("KMS not configured. Please configure Hanzo KSM first.")
        }
      }
    } catch (e) {
      console.error("Failed to connect wallet:", e)
    } finally {
      setLoading(false)
    }
  }

  function disconnectWallet() {
    setWallet({
      connected: false,
      address: null,
      chain: null,
      balance: 0,
      kmsConfigured: false,
    })
  }

  function copyAddress() {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staking Dashboard</h1>
          <p className="text-muted-foreground">
            Manage validators, stake tokens, and earn rewards
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/markets">
            <Coins className="mr-2 h-4 w-4" />
            View Markets
          </Link>
        </Button>
      </div>

      {/* Wallet Connection */}
      <Card className={wallet.connected ? "border-green-500/50 bg-green-500/5" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {wallet.connected ? "Wallet Connected" : "Connect Wallet"}
          </CardTitle>
          <CardDescription>
            {wallet.connected
              ? "Your wallet is connected and ready for staking"
              : "Connect a wallet to start staking across multiple chains"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wallet.connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {wallet.kmsConfigured ? <Key className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-mono text-sm">
                      {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {wallet.chain} {wallet.kmsConfigured && "• KMS Secured"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={copyAddress}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={disconnectWallet}>
                    Disconnect
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-2xl font-bold">{wallet.balance.toFixed(4)} ETH</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Staked</p>
                  <p className="text-2xl font-bold">0 ETH</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Rewards</p>
                  <p className="text-2xl font-bold text-green-500">0 ETH</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => connectWallet("metamask")}
                disabled={loading}
              >
                <Wallet className="h-8 w-8" />
                <span>MetaMask / Browser</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => connectWallet("ledger")}
                disabled={loading}
              >
                <Shield className="h-8 w-8" />
                <span>Ledger Hardware</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-primary/50 bg-primary/5"
                onClick={() => connectWallet("kms")}
                disabled={loading}
              >
                <Key className="h-8 w-8" />
                <span>Hanzo KMS</span>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KMS Security Notice */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Enterprise Key Management</p>
              <p className="text-sm text-muted-foreground">
                For production deployments, use Hanzo KMS (Key Management System) with HSM backing.
                Supports multi-sig, role-based access, and hardware security modules for maximum security.
              </p>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/settings/keys">
                    <Key className="mr-2 h-4 w-4" />
                    Configure KMS
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://docs.hanzo.ai/kms" target="_blank" rel="noopener noreferrer">
                    Documentation <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Validators */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Validators</CardTitle>
              <CardDescription>Active validators across all chains</CardDescription>
            </div>
            <Button asChild>
              <Link href="/dashboard/infrastructure/nodes">
                <Server className="mr-2 h-4 w-4" />
                Deploy Validator
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {validators.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No validators yet</p>
              <p className="text-sm">Deploy a staking node to start earning rewards</p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/infrastructure/nodes">
                  Get Started
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {validators.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{v.chain} Validator</p>
                      <p className="text-xs text-muted-foreground font-mono">{v.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-medium">{v.stake} staked</p>
                      <p className="text-xs text-green-500">+{v.rewards} earned</p>
                    </div>
                    <Badge variant={v.status === "active" ? "default" : "secondary"}>
                      {v.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-yellow-500" />
              Quick Stake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              One-click staking deployment with optimized settings for maximum yield.
            </p>
            <Button className="w-full" disabled={!wallet.connected}>
              {wallet.connected ? "Stake Now" : "Connect Wallet First"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCcw className="h-5 w-5 text-blue-500" />
              Auto-Compound
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Automatically reinvest staking rewards for compound growth.
            </p>
            <Button variant="outline" className="w-full" disabled={!wallet.connected}>
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-purple-500" />
              Liquid Staking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Stake while keeping liquidity with stETH, rETH, and more derivatives.
            </p>
            <Button variant="outline" className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
          <CardDescription>Protect your staking infrastructure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Use Hardware Security Modules (HSM)</p>
                <p className="text-sm text-muted-foreground">
                  Store validator keys in tamper-resistant hardware
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Enable Multi-Signature</p>
                <p className="text-sm text-muted-foreground">
                  Require multiple approvals for sensitive operations
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Monitor Slashing Conditions</p>
                <p className="text-sm text-muted-foreground">
                  Set up alerts for double-signing and downtime risks
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Use Kubernetes Operators</p>
                <p className="text-sm text-muted-foreground">
                  Deploy with production-grade orchestration
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
