"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Server, ArrowLeft, Play, Square, Trash2, RefreshCcw, Copy, Check,
  Activity, HardDrive, Cpu, MemoryStick, Network, Loader2, Terminal
} from "lucide-react"

interface NodeDetails {
  id: string
  name: string
  chain: string
  network: string
  provider: string
  status: string
  endpoint: string | null
  ws_endpoint?: string | null
  beacon_api?: string | null
  validator_api?: string | null
  execution_client?: string
  consensus_client?: string
  mev_enabled?: boolean
  containers?: string[]
  created_at: string
  metrics?: {
    current_block?: number
    highest_block?: number
    sync_progress?: number
    syncing?: boolean
    peer_count?: number
    chain_id?: number
    cpu_usage?: number
    memory_usage?: number
    disk_usage?: number
    network_rx?: number
    network_tx?: number
  }
  error?: string
}

export default function NodeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const nodeId = params.id as string

  const [node, setNode] = useState<NodeDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [rpcInput, setRpcInput] = useState('{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}')
  const [rpcResult, setRpcResult] = useState<string | null>(null)
  const [rpcLoading, setRpcLoading] = useState(false)

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("bootnode_token")
    const apiKey = localStorage.getItem("bootnode_api_key")
    if (token) return { "Authorization": `Bearer ${token}` }
    if (apiKey) return { "X-API-Key": apiKey }
    return {}
  }

  async function fetchNode() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/v1/nodes/${nodeId}`,
        { headers: getAuthHeaders() }
      )
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
      const data = await res.json()
      setNode(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNode()
    const interval = setInterval(fetchNode, 5000)
    return () => clearInterval(interval)
  }, [nodeId])

  async function handleAction(action: "start" | "stop" | "delete") {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    try {
      if (action === "delete") {
        if (!confirm("Are you sure you want to delete this node?")) return
        await fetch(`${apiUrl}/v1/nodes/${nodeId}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        })
        router.push("/dashboard/infrastructure/nodes")
      } else {
        const res = await fetch(`${apiUrl}/v1/nodes/${nodeId}/${action}`, {
          method: "POST",
          headers: getAuthHeaders()
        })
        if (res.ok) fetchNode()
      }
    } catch (e) {
      console.error(`Failed to ${action}:`, e)
    }
  }

  async function sendRpcRequest() {
    if (!node?.endpoint) return
    setRpcLoading(true)
    try {
      const payload = JSON.parse(rpcInput)
      const res = await fetch(node.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      setRpcResult(JSON.stringify(data, null, 2))
    } catch (e) {
      setRpcResult(`Error: ${e}`)
    } finally {
      setRpcLoading(false)
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !node) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">{error || "Node not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Server className="h-6 w-6" />
              {node.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={node.status === "running" ? "default" : "secondary"}>
                {node.status}
              </Badge>
              <Badge variant="outline">{node.chain}</Badge>
              <Badge variant="outline">{node.network}</Badge>
              {node.execution_client && <Badge variant="secondary">{node.execution_client}</Badge>}
              {node.consensus_client && <Badge variant="secondary">{node.consensus_client}</Badge>}
              {node.mev_enabled && <Badge className="bg-purple-500">MEV</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchNode}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          {node.status === "running" ? (
            <Button variant="outline" size="sm" onClick={() => handleAction("stop")}>
              <Square className="h-4 w-4 mr-2" /> Stop
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleAction("start")}>
              <Play className="h-4 w-4 mr-2" /> Start
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => handleAction("delete")}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
          <CardDescription>Connection URLs for your node</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {node.endpoint && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">RPC Endpoint</p>
                <code className="text-sm text-muted-foreground">{node.endpoint}</code>
              </div>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(node.endpoint!, "rpc")}>
                {copied === "rpc" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
          {node.ws_endpoint && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">WebSocket Endpoint</p>
                <code className="text-sm text-muted-foreground">{node.ws_endpoint}</code>
              </div>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(node.ws_endpoint!, "ws")}>
                {copied === "ws" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
          {node.beacon_api && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Beacon API</p>
                <code className="text-sm text-muted-foreground">{node.beacon_api}</code>
              </div>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(node.beacon_api!, "beacon")}>
                {copied === "beacon" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" /> Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {node.metrics?.syncing ? (
              <>
                <p className="text-2xl font-bold">{node.metrics.sync_progress?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  Block {node.metrics.current_block?.toLocaleString()} / {node.metrics.highest_block?.toLocaleString()}
                </p>
              </>
            ) : node.metrics?.current_block ? (
              <>
                <p className="text-2xl font-bold text-green-500">Synced</p>
                <p className="text-xs text-muted-foreground">Block {node.metrics.current_block?.toLocaleString()}</p>
              </>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Network className="h-4 w-4" /> Peers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{node.metrics?.peer_count ?? "-"}</p>
            <p className="text-xs text-muted-foreground">Connected peers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4" /> CPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{node.metrics?.cpu_usage?.toFixed(1) ?? "-"}%</p>
            <p className="text-xs text-muted-foreground">Usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MemoryStick className="h-4 w-4" /> Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{node.metrics?.memory_usage?.toFixed(1) ?? "-"} GB</p>
            <p className="text-xs text-muted-foreground">Used</p>
          </CardContent>
        </Card>
      </div>

      {/* RPC Console */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" /> RPC Console
          </CardTitle>
          <CardDescription>Send JSON-RPC requests to your node</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Request</label>
            <textarea
              value={rpcInput}
              onChange={(e) => setRpcInput(e.target.value)}
              className="w-full h-24 mt-1 p-3 font-mono text-sm border rounded-lg bg-muted"
              placeholder='{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
            />
          </div>
          <Button onClick={sendRpcRequest} disabled={rpcLoading || !node.endpoint}>
            {rpcLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Send Request
          </Button>
          {rpcResult && (
            <div>
              <label className="text-sm font-medium">Response</label>
              <pre className="mt-1 p-3 font-mono text-sm bg-muted rounded-lg overflow-auto max-h-48">
                {rpcResult}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Containers */}
      {node.containers && node.containers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Containers</CardTitle>
            <CardDescription>Docker containers for this node</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {node.containers.map((cid) => (
                <div key={cid} className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm">
                  <Server className="h-4 w-4" />
                  {cid}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
