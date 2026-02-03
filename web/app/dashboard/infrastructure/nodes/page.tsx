"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Server, Plus, ExternalLink, Loader2, X } from "lucide-react"

interface Node {
  id: string
  name: string
  chain: string
  network: string
  provider: string
  status: string
  endpoint: string | null
  created_at: string
  metrics?: {
    block_height?: number
    peer_count?: number
    sync_progress?: number
    cpu_usage?: number
    memory_usage?: number
  }
}

export default function NodesPage() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [chain, setChain] = useState("ethereum")
  const [network, setNetwork] = useState("mainnet")
  const [provider, setProvider] = useState("docker")

  function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("bootnode_token")
    const apiKey = localStorage.getItem("bootnode_api_key")
    if (token) return { "Authorization": `Bearer ${token}` }
    if (apiKey) return { "X-API-Key": apiKey }
    return {}
  }

  async function fetchNodes() {
    try {
      const res = await fetch("http://localhost:8100/v1/nodes/", {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setNodes(Array.isArray(data) ? data : [])
      } else {
        setError(`Failed to fetch nodes: ${res.status}`)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNodes()
  }, [])

  async function handleCreate() {
    if (!name.trim() || !chain.trim()) return
    setCreating(true)
    setCreateError(null)

    try {
      const res = await fetch("http://localhost:8100/v1/nodes/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: name.trim(),
          chain: chain.trim(),
          network: network.trim(),
          provider: provider.trim(),
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || `Failed: ${res.status}`)
      }

      const newNode = await res.json()
      setNodes(prev => [...prev, newNode])
      setName("")
      setChain("ethereum")
      setNetwork("mainnet")
      setProvider("docker")
      setShowCreate(false)
    } catch (e) {
      setCreateError(String(e))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nodes</h1>
          <p className="text-muted-foreground">
            Deploy and manage blockchain nodes
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Deploy Node
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Deploy New Node</CardTitle>
            <CardDescription>Configure and deploy a blockchain node</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Node Name</label>
                <Input
                  placeholder="e.g., Ethereum Mainnet Node"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Chain</label>
                <Input
                  placeholder="ethereum, bitcoin, solana..."
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
                <label className="text-sm font-medium">Provider</label>
                <Input
                  placeholder="docker, aws, gcp..."
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            {createError && (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {createError}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deploy Node
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : nodes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : nodes.filter(n => n.status === "running").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={error ? "destructive" : "default"}>
              {loading ? "Loading" : error ? "Error" : "Connected"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Nodes List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Nodes</CardTitle>
          <CardDescription>
            Blockchain nodes deployed through Bootnode
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">{error}</div>
          ) : nodes.length === 0 ? (
            <div className="text-center text-muted-foreground p-12">
              No nodes deployed yet. Click "Deploy Node" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {nodes.map((node) => (
                <div key={node.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{node.name}</h4>
                        <Badge variant={node.status === "running" ? "default" : node.status === "starting" ? "secondary" : "outline"}>
                          {node.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{node.chain}</Badge>
                        <Badge variant="outline" className="text-xs">{node.network}</Badge>
                        <Badge variant="outline" className="text-xs">{node.provider}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {node.metrics && node.metrics.block_height && (
                      <>
                        <div className="text-right">
                          <p className="text-sm font-medium">{node.metrics.block_height.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">block height</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{node.metrics.peer_count}</p>
                          <p className="text-xs text-muted-foreground">peers</p>
                        </div>
                      </>
                    )}
                    {node.endpoint && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={node.endpoint} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Chains */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Chains</CardTitle>
          <CardDescription>Available blockchain nodes for deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {["ethereum", "bitcoin", "solana", "polygon", "arbitrum", "optimism", "base", "avalanche", "bsc", "lux"].map((c) => (
              <Button
                key={c}
                variant="outline"
                className="justify-start capitalize"
                onClick={() => { setChain(c); setShowCreate(true); }}
              >
                <Server className="mr-2 h-4 w-4" />
                {c}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
