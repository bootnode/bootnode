"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Server, Plus, ExternalLink, Loader2, X, Play, Square, Trash2, RefreshCcw, Activity, AlertTriangle, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getBrand } from "@/lib/brand"

const brand = getBrand()

// Chain icons (using crypto symbols and emoji fallbacks)
const CHAIN_ICONS: Record<string, string> = {
  // Hanzo Ecosystem
  lux: "💎",
  zoo: "🦁",
  pars: "🌟",
  hanzo: "⚡",
  // Major L1s
  ethereum: "⟠",
  bitcoin: "₿",
  solana: "◎",
  avalanche: "🔺",
  cardano: "₳",
  polkadot: "●",
  cosmos: "⚛",
  near: "Ⓝ",
  tron: "⚡",
  ton: "💎",
  hedera: "ℏ",
  filecoin: "⨏",
  // L2s & Rollups
  polygon: "⬡",
  arbitrum: "🔵",
  optimism: "🔴",
  base: "🔷",
  bsc: "🟡",
  zksync: "⬢",
  linea: "▬",
  scroll: "📜",
  mantle: "Ⓜ",
  blast: "💥",
  starknet: "⬡",
  // Alt L1s
  xrpl: "✕",
  fantom: "👻",
  cronos: "🔶",
  gnosis: "🦉",
  celo: "🟢",
  moonbeam: "🌙",
  sei: "🌊",
  sui: "💧",
  aptos: "🔷",
  // Staking & DeFi chains
  bittensor: "🧠",
  tezos: "ꜩ",
  algorand: "Ⱥ",
  injective: "💉",
  iota: "ι",
  stacks: "Ⓢ",
  celestia: "☀",
  aleo: "🔐",
  fetch: "🤖",
  livepeer: "🎬",
  multiversx: "✕",
  akash: "☁",
  zetachain: "Z",
  axelar: "🔗",
  dydx: "📊",
  casper: "👻",
  avail: "▲",
  band: "📡",
  secret: "🔒",
  skale: "⬡",
  waves: "🌊",
  osmosis: "🧪",
  radix: "◉",
  harmony: "♾",
  kava: "🔶",
}

// Supported chains and networks for node deployment
const SUPPORTED_CHAINS: Record<string, { name: string; networks: string[]; category: string }> = {
  // Layer 1 - Main
  ethereum: {
    name: "Ethereum",
    networks: ["mainnet", "sepolia", "holesky"],
    category: "L1",
  },
  bitcoin: {
    name: "Bitcoin",
    networks: ["mainnet", "testnet", "signet"],
    category: "L1",
  },
  solana: {
    name: "Solana",
    networks: ["mainnet", "devnet", "testnet"],
    category: "L1",
  },
  avalanche: {
    name: "Avalanche",
    networks: ["mainnet", "fuji"],
    category: "L1",
  },
  lux: {
    name: "Lux",
    networks: ["mainnet", "testnet", "local"],
    category: "L1",
  },
  zoo: {
    name: "Zoo",
    networks: ["mainnet", "testnet", "local"],
    category: "L1",
  },
  pars: {
    name: "Pars",
    networks: ["mainnet", "testnet", "local"],
    category: "L1",
  },
  hanzo: {
    name: "Hanzo",
    networks: ["mainnet", "testnet", "local"],
    category: "L1",
  },
  // Layer 2 - ETH Rollups
  arbitrum: {
    name: "Arbitrum",
    networks: ["mainnet", "sepolia", "nova"],
    category: "L2",
  },
  optimism: {
    name: "Optimism",
    networks: ["mainnet", "sepolia"],
    category: "L2",
  },
  base: {
    name: "Base",
    networks: ["mainnet", "sepolia"],
    category: "L2",
  },
  zksync: {
    name: "zkSync Era",
    networks: ["mainnet", "sepolia"],
    category: "L2",
  },
  linea: {
    name: "Linea",
    networks: ["mainnet", "sepolia"],
    category: "L2",
  },
  scroll: {
    name: "Scroll",
    networks: ["mainnet", "sepolia"],
    category: "L2",
  },
  mantle: {
    name: "Mantle",
    networks: ["mainnet", "sepolia"],
    category: "L2",
  },
  blast: {
    name: "Blast",
    networks: ["mainnet", "sepolia"],
    category: "L2",
  },
  polygon: {
    name: "Polygon",
    networks: ["mainnet", "amoy", "zkevm"],
    category: "L2",
  },
  // Other L1s
  bsc: {
    name: "BNB Chain",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  xrpl: {
    name: "XRP Ledger",
    networks: ["mainnet", "testnet", "devnet"],
    category: "L1",
  },
  cardano: {
    name: "Cardano",
    networks: ["mainnet", "preprod", "preview"],
    category: "L1",
  },
  polkadot: {
    name: "Polkadot",
    networks: ["mainnet", "westend"],
    category: "L1",
  },
  cosmos: {
    name: "Cosmos Hub",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  near: {
    name: "NEAR",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  fantom: {
    name: "Fantom",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  cronos: {
    name: "Cronos",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  gnosis: {
    name: "Gnosis Chain",
    networks: ["mainnet", "chiado"],
    category: "L1",
  },
  celo: {
    name: "Celo",
    networks: ["mainnet", "alfajores"],
    category: "L1",
  },
  moonbeam: {
    name: "Moonbeam",
    networks: ["mainnet", "moonbase"],
    category: "L1",
  },
  sei: {
    name: "Sei",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  sui: {
    name: "Sui",
    networks: ["mainnet", "testnet", "devnet"],
    category: "L1",
  },
  aptos: {
    name: "Aptos",
    networks: ["mainnet", "testnet", "devnet"],
    category: "L1",
  },
  ton: {
    name: "TON",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  tron: {
    name: "TRON",
    networks: ["mainnet", "shasta", "nile"],
    category: "L1",
  },
  filecoin: {
    name: "Filecoin",
    networks: ["mainnet", "calibration"],
    category: "L1",
  },
  hedera: {
    name: "Hedera",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  // Additional Staking Chains
  bittensor: {
    name: "Bittensor",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  tezos: {
    name: "Tezos",
    networks: ["mainnet", "ghostnet"],
    category: "L1",
  },
  algorand: {
    name: "Algorand",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  injective: {
    name: "Injective",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  iota: {
    name: "IOTA",
    networks: ["mainnet", "shimmer"],
    category: "L1",
  },
  stacks: {
    name: "Stacks",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  celestia: {
    name: "Celestia",
    networks: ["mainnet", "mocha"],
    category: "L1",
  },
  aleo: {
    name: "Aleo",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  fetch: {
    name: "Fetch.ai",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  livepeer: {
    name: "Livepeer",
    networks: ["mainnet"],
    category: "L1",
  },
  multiversx: {
    name: "MultiversX",
    networks: ["mainnet", "devnet"],
    category: "L1",
  },
  starknet: {
    name: "Starknet",
    networks: ["mainnet", "sepolia"],
    category: "L2",
  },
  akash: {
    name: "Akash",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  zetachain: {
    name: "ZetaChain",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  axelar: {
    name: "Axelar",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  dydx: {
    name: "dYdX",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  casper: {
    name: "Casper",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  avail: {
    name: "Avail",
    networks: ["mainnet", "turing"],
    category: "L1",
  },
  band: {
    name: "Band Protocol",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  secret: {
    name: "Secret Network",
    networks: ["mainnet", "pulsar"],
    category: "L1",
  },
  skale: {
    name: "SKALE",
    networks: ["mainnet"],
    category: "L2",
  },
  waves: {
    name: "Waves",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  osmosis: {
    name: "Osmosis",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  radix: {
    name: "Radix",
    networks: ["mainnet", "stokenet"],
    category: "L1",
  },
  harmony: {
    name: "Harmony",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
  kava: {
    name: "Kava",
    networks: ["mainnet", "testnet"],
    category: "L1",
  },
}

interface Node {
  id: string
  name: string
  chain: string
  network: string
  provider: string
  status: string
  endpoint: string | null
  ws_endpoint?: string | null
  beacon_api?: string | null
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
    memory_percent?: number
    disk_usage?: number
    network_rx?: number
    network_tx?: number
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
  const [advancedMode, setAdvancedMode] = useState(false)
  const [preset, setPreset] = useState("full")
  const [executionClient, setExecutionClient] = useState("geth")
  const [consensusClient, setConsensusClient] = useState("lighthouse")
  const [enableMev, setEnableMev] = useState(false)
  const [enableValidator, setEnableValidator] = useState(false)
  const [feeRecipient, setFeeRecipient] = useState("")
  const [refreshingMetrics, setRefreshingMetrics] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("bootnode_token")
    const apiKey = localStorage.getItem("bootnode_api_key")
    if (token) return { "Authorization": `Bearer ${token}` }
    if (apiKey) return { "X-API-Key": apiKey }
    return {}
  }

  async function fetchNodes() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/v1/nodes/`, {
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

  async function refreshMetrics() {
    setRefreshingMetrics(true)
    try {
      // Fetch detailed metrics for each node
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const metricsRes = await fetch(`${apiUrl}/v1/nodes/metrics/all`, {
        headers: getAuthHeaders()
      })
      if (metricsRes.ok) {
        const metrics = await metricsRes.json()
        // Update nodes with metrics
        setNodes(prev => prev.map(node => ({
          ...node,
          metrics: { ...node.metrics, ...metrics[node.id] }
        })))
      }
    } catch (e) {
      console.error("Failed to refresh metrics:", e)
    } finally {
      setRefreshingMetrics(false)
    }
  }

  useEffect(() => {
    fetchNodes()
  }, [])

  // Auto-refresh metrics every 10 seconds
  useEffect(() => {
    if (nodes.length === 0) return
    refreshMetrics()
    const interval = setInterval(refreshMetrics, 10000)
    return () => clearInterval(interval)
  }, [nodes.length])

  async function handleCreate() {
    if (!name.trim() || !chain.trim()) return
    setCreating(true)
    setCreateError(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/v1/nodes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: name.trim() || `${chain}-${network}-node`,
          chain: chain.trim(),
          network: network.trim(),
          provider: advancedMode ? provider.trim() : "docker",
          mode: advancedMode ? "advanced" : "simple",
          preset: !advancedMode && chain === "ethereum" ? preset : undefined,
          execution_client: advancedMode && chain === "ethereum" ? executionClient : undefined,
          consensus_client: advancedMode && chain === "ethereum" ? (consensusClient || null) : undefined,
          enable_mev: advancedMode && chain === "ethereum" ? enableMev : false,
          enable_validator: advancedMode && chain === "ethereum" ? enableValidator : false,
          fee_recipient: advancedMode && enableValidator ? feeRecipient : undefined,
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

  async function handleNodeAction(nodeId: string, action: "start" | "stop" | "delete") {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    try {
      if (action === "delete") {
        const res = await fetch(`${apiUrl}/v1/nodes/${nodeId}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        })
        if (res.ok) {
          setNodes(prev => prev.filter(n => n.id !== nodeId))
        }
      } else {
        const res = await fetch(`${apiUrl}/v1/nodes/${nodeId}/${action}`, {
          method: "POST",
          headers: getAuthHeaders()
        })
        if (res.ok) {
          const updated = await res.json()
          setNodes(prev => prev.map(n => n.id === nodeId ? updated : n))
        }
      }
    } catch (e) {
      console.error(`Failed to ${action} node:`, e)
    }
  }

  async function handleDeleteAll() {
    if (!confirm(`Are you sure you want to delete ALL ${nodes.length} nodes? This cannot be undone.`)) return
    setDeletingAll(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    try {
      // Delete all nodes in parallel
      await Promise.all(nodes.map(node =>
        fetch(`${apiUrl}/v1/nodes/${node.id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        })
      ))
      setNodes([])
    } catch (e) {
      console.error("Failed to delete all nodes:", e)
    } finally {
      setDeletingAll(false)
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshMetrics} disabled={refreshingMetrics}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshingMetrics ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {nodes.length > 0 && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={handleDeleteAll} disabled={deletingAll}>
              {deletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete All
            </Button>
          )}
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            Deploy Node
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Deploy New Node</CardTitle>
            <CardDescription>Configure and deploy a blockchain node</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <span className="text-sm font-medium">Deployment Mode</span>
                <p className="text-xs text-muted-foreground">
                  {advancedMode ? "Full control over all settings" : "Quick deploy with optimized presets"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${!advancedMode ? "font-medium" : "text-muted-foreground"}`}>Simple</span>
                <button
                  type="button"
                  onClick={() => setAdvancedMode(!advancedMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${advancedMode ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${advancedMode ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className={`text-sm ${advancedMode ? "font-medium" : "text-muted-foreground"}`}>Advanced</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Node Name</label>
                <Input
                  placeholder="e.g., My ETH Node"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Chain</label>
                <select
                  value={chain}
                  onChange={(e) => { setChain(e.target.value); setNetwork(SUPPORTED_CHAINS[e.target.value]?.networks[0] || "mainnet") }}
                  className="mt-1 w-full px-3 py-2 border rounded-md bg-background"
                >
                  <optgroup label="Hanzo Ecosystem">
                    {["lux", "zoo", "pars", "hanzo"].map((key) => (
                      <option key={key} value={key}>{CHAIN_ICONS[key]} {SUPPORTED_CHAINS[key]?.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Layer 1">
                    {Object.entries(SUPPORTED_CHAINS)
                      .filter(([key, info]) => info.category === "L1" && !["lux", "zoo", "pars", "hanzo"].includes(key))
                      .map(([key, info]) => (
                        <option key={key} value={key}>{CHAIN_ICONS[key] || "⬡"} {info.name}</option>
                      ))}
                  </optgroup>
                  <optgroup label="Layer 2 & Rollups">
                    {Object.entries(SUPPORTED_CHAINS)
                      .filter(([_, info]) => info.category === "L2")
                      .map(([key, info]) => (
                        <option key={key} value={key}>{CHAIN_ICONS[key] || "⬡"} {info.name}</option>
                      ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Network</label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md bg-background"
                >
                  {(SUPPORTED_CHAINS[chain]?.networks || ["mainnet"]).map((net) => (
                    <option key={net} value={net}>{net}</option>
                  ))}
                </select>
              </div>
              {!advancedMode && chain === "ethereum" && (
                <div>
                  <label className="text-sm font-medium">Node Type</label>
                  <Select value={preset} onValueChange={setPreset} className="mt-1">
                    <option value="rpc">RPC Only - Fast, minimal (no sync)</option>
                    <option value="full">Full Node - Syncs all blocks</option>
                    <option value="staking">Staking Node - Validator ready + MEV</option>
                    <option value="archive">Archive Node - Full history (~18TB)</option>
                  </Select>
                </div>
              )}
              {advancedMode && (
                <div>
                  <label className="text-sm font-medium">Provider</label>
                  <Select value={provider} onValueChange={setProvider} className="mt-1">
                    <option value="docker">Docker (Local)</option>
                    <option value="cloud">Cloud (Managed)</option>
                  </Select>
                </div>
              )}
            </div>

            {/* Advanced Ethereum options */}
            {advancedMode && chain === "ethereum" && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Execution Client</label>
                    <Select value={executionClient} onValueChange={setExecutionClient} className="mt-1">
                      <option value="geth">Geth (Go Ethereum)</option>
                      <option value="nethermind">Nethermind (.NET)</option>
                      <option value="besu">Besu (Java)</option>
                      <option value="erigon">Erigon (Go, archive)</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Consensus Client</label>
                    <Select value={consensusClient} onValueChange={setConsensusClient} className="mt-1">
                      <option value="lighthouse">Lighthouse (Rust)</option>
                      <option value="prysm">Prysm (Go)</option>
                      <option value="lodestar">Lodestar (TypeScript)</option>
                      <option value="teku">Teku (Java)</option>
                      <option value="">None (RPC proxy only)</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableMev}
                        onChange={(e) => setEnableMev(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                        disabled={!consensusClient}
                      />
                      <span className="text-sm font-medium">Enable MEV-Boost</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableValidator}
                        onChange={(e) => setEnableValidator(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                        disabled={!consensusClient}
                      />
                      <span className="text-sm font-medium">Enable Validator</span>
                    </label>
                  </div>
                </div>
                {enableValidator && (
                  <div>
                    <label className="text-sm font-medium">Fee Recipient Address</label>
                    <Input
                      placeholder="0x... (ETH address for staking rewards)"
                      value={feeRecipient}
                      onChange={(e) => setFeeRecipient(e.target.value)}
                      className="mt-1 font-mono"
                    />
                  </div>
                )}
              </div>
            )}
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
            Blockchain nodes deployed through {brand.name}
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
                <div key={node.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
                  <Link href={`/dashboard/infrastructure/nodes/${node.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xl">
                      {CHAIN_ICONS[node.chain] || <Server className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{node.name}</h4>
                        <Badge variant={node.status === "running" ? "default" : node.status === "starting" ? "secondary" : "outline"}>
                          {node.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{node.chain}</Badge>
                        <Badge variant="outline" className="text-xs">{node.network}</Badge>
                        {node.execution_client && (
                          <Badge variant="secondary" className="text-xs">{node.execution_client}</Badge>
                        )}
                        {node.consensus_client && (
                          <Badge variant="secondary" className="text-xs">{node.consensus_client}</Badge>
                        )}
                        {node.mev_enabled && (
                          <Badge className="text-xs bg-purple-500">MEV</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Sync Progress */}
                    {node.metrics?.current_block !== undefined && (
                      <div className="text-right min-w-[100px] hidden lg:block">
                        <p className="text-sm font-medium font-mono">
                          {node.metrics.current_block.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {node.metrics.syncing ? (
                            <span className="text-yellow-500">
                              Syncing {node.metrics.sync_progress?.toFixed(1)}%
                            </span>
                          ) : (
                            "Synced"
                          )}
                        </p>
                      </div>
                    )}
                    {/* Peers */}
                    {node.metrics?.peer_count !== undefined && (
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium">{node.metrics.peer_count}</p>
                        <p className="text-xs text-muted-foreground">peers</p>
                      </div>
                    )}
                    {/* CPU */}
                    {node.metrics?.cpu_usage !== undefined && (
                      <div className="text-right hidden lg:block">
                        <p className="text-sm font-medium">{node.metrics.cpu_usage.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">CPU</p>
                      </div>
                    )}
                    {/* Memory */}
                    {node.metrics?.memory_usage !== undefined && (
                      <div className="text-right hidden lg:block">
                        <p className="text-sm font-medium">{node.metrics.memory_usage.toFixed(1)} GB</p>
                        <p className="text-xs text-muted-foreground">Memory</p>
                      </div>
                    )}
                    {/* Disk */}
                    {node.metrics?.disk_usage !== undefined && node.metrics.disk_usage > 0 && (
                      <div className="text-right hidden xl:block">
                        <p className="text-sm font-medium">{node.metrics.disk_usage.toFixed(1)} GB</p>
                        <p className="text-xs text-muted-foreground">Disk</p>
                      </div>
                    )}
                    {/* Network */}
                    {node.metrics?.network_rx !== undefined && (
                      <div className="text-right hidden xl:block">
                        <p className="text-sm font-medium">
                          <span className="text-green-500">↓</span>{node.metrics.network_rx.toFixed(0)}
                          <span className="text-blue-500 ml-1">↑</span>{node.metrics.network_tx?.toFixed(0) || 0} MB
                        </p>
                        <p className="text-xs text-muted-foreground">Network</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {node.status === "running" ? (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); handleNodeAction(node.id, "stop"); }} title="Stop node">
                          <Square className="h-4 w-4" />
                        </Button>
                      ) : node.status === "stopped" || node.status === "exited" ? (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); handleNodeAction(node.id, "start"); }} title="Start node">
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {node.endpoint && (
                        <Button variant="ghost" size="icon" asChild title="Open RPC endpoint">
                          <a href={node.endpoint} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.preventDefault(); handleNodeAction(node.id, "delete"); }} title="Delete node">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consensus Client Notice for ETH nodes */}
      {nodes.some(n => n.chain === "ethereum" && n.metrics?.peer_count && n.metrics.peer_count > 0 && n.metrics.current_block === 0) && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">Consensus Client Required</p>
                <p className="text-sm text-muted-foreground">
                  Post-Merge Ethereum requires a consensus client (beacon node) to sync.
                  Geth execution nodes need Prysm, Lighthouse, or similar running alongside.
                  RPC endpoints are functional but blocks won't sync without a beacon client.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supported Chains */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Chains</CardTitle>
          <CardDescription>30+ blockchain nodes available - Click to deploy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hanzo/Lux Ecosystem */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Hanzo Ecosystem</h4>
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              {["lux", "zoo", "pars", "hanzo"].map((c) => (
                <Button
                  key={c}
                  variant="outline"
                  className="justify-start"
                  onClick={() => { setChain(c); setShowCreate(true); }}
                >
                  <span className="mr-2 text-lg">{CHAIN_ICONS[c]}</span>
                  {SUPPORTED_CHAINS[c]?.name || c}
                </Button>
              ))}
            </div>
          </div>
          {/* Layer 1s */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Layer 1 Blockchains</h4>
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {Object.entries(SUPPORTED_CHAINS)
                .filter(([key, info]) => info.category === "L1" && !["lux", "zoo", "pars", "hanzo"].includes(key))
                .map(([key, info]) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="justify-start"
                    onClick={() => { setChain(key); setShowCreate(true); }}
                  >
                    <span className="mr-2 text-lg">{CHAIN_ICONS[key] || "⬡"}</span>
                    {info.name}
                  </Button>
                ))}
            </div>
          </div>
          {/* Layer 2s */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Layer 2 & Rollups</h4>
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {Object.entries(SUPPORTED_CHAINS)
                .filter(([_, info]) => info.category === "L2")
                .map(([key, info]) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="justify-start"
                    onClick={() => { setChain(key); setShowCreate(true); }}
                  >
                    <span className="mr-2 text-lg">{CHAIN_ICONS[key] || "⬡"}</span>
                    {info.name}
                  </Button>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
