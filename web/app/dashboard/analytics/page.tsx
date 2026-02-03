"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NodeMap } from "@/components/d3/node-map"
import { DonutChart } from "@/components/d3/donut-chart"
import {
  Activity,
  Server,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCcw,
  TrendingUp,
  Globe
} from "lucide-react"

interface AnalyticsData {
  totalRequests: number
  computeUnits: number
  avgResponseTime: number
  successRate: number
  chainBreakdown: { label: string; value: number; color: string }[]
  methodBreakdown: { method: string; count: number; percentage: number }[]
  nodeLocations: {
    id: string
    name: string
    point: [number, number]
    count: number
    status: "running" | "stopped" | "syncing" | "error"
    chain?: string
  }[]
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("bootnode_token")
    const apiKey = localStorage.getItem("bootnode_api_key")
    if (token) return { "Authorization": `Bearer ${token}` }
    if (apiKey) return { "X-API-Key": apiKey }
    return {}
  }

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const headers = getAuthHeaders()

      // Fetch real data from multiple endpoints
      const [nodesRes, chainsRes, keysRes, webhooksRes] = await Promise.all([
        fetch("http://localhost:8100/v1/nodes/", { headers }).catch(() => null),
        fetch("http://localhost:8100/v1/chains", { headers }).catch(() => null),
        fetch("http://localhost:8100/v1/auth/keys", { headers }).catch(() => null),
        fetch("http://localhost:8100/v1/webhooks", { headers }).catch(() => null),
      ])

      const nodes = nodesRes?.ok ? await nodesRes.json() : []
      const chains = chainsRes?.ok ? await chainsRes.json() : []
      const keys = keysRes?.ok ? await keysRes.json() : []
      const webhooks = webhooksRes?.ok ? await webhooksRes.json() : []

      // Build chain breakdown from chains data
      const chainColors = [
        "#3b82f6", // blue
        "#8b5cf6", // violet
        "#10b981", // emerald
        "#f59e0b", // amber
        "#ef4444", // red
        "#ec4899", // pink
        "#06b6d4", // cyan
        "#84cc16", // lime
      ]

      const chainBreakdown = Array.isArray(chains)
        ? chains.slice(0, 5).map((chain: any, idx: number) => ({
            label: chain.name || chain.chain || "Unknown",
            value: Math.floor(Math.random() * 40) + 10, // Placeholder - would come from usage API
            color: chainColors[idx % chainColors.length]
          }))
        : []

      // Add "Others" if there are more chains
      if (chains.length > 5) {
        chainBreakdown.push({
          label: "Others",
          value: chains.length - 5,
          color: "#6b7280"
        })
      }

      // Build node locations from nodes data
      // Example node locations - in production would come from node metadata
      const regions: Record<string, [number, number]> = {
        "us-east": [-74.006, 40.7128],
        "us-west": [-122.4194, 37.7749],
        "eu-west": [-0.1276, 51.5074],
        "eu-central": [13.405, 52.52],
        "asia-east": [139.6917, 35.6895],
        "asia-south": [77.1025, 28.7041],
        "default": [0, 20]
      }

      const nodeLocations = Array.isArray(nodes)
        ? nodes.map((node: any, idx: number) => {
            const region = node.region || "default"
            const coords = regions[region] || regions.default
            // Add small random offset to prevent overlap
            const offset = [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10]
            return {
              id: node.id || `node-${idx}`,
              name: node.name || `Node ${idx + 1}`,
              point: [coords[0] + offset[0], coords[1] + offset[1]] as [number, number],
              count: 1,
              status: (node.status === "running" ? "running" : node.status === "syncing" ? "syncing" : "stopped") as "running" | "stopped" | "syncing" | "error",
              chain: node.chain || node.network
            }
          })
        : []

      // Common RPC methods with placeholder counts
      const methodBreakdown = [
        { method: "eth_call", count: 0, percentage: 25 },
        { method: "eth_getBalance", count: 0, percentage: 20 },
        { method: "eth_getLogs", count: 0, percentage: 18 },
        { method: "eth_getTransactionReceipt", count: 0, percentage: 15 },
        { method: "eth_blockNumber", count: 0, percentage: 12 },
        { method: "Others", count: 0, percentage: 10 },
      ]

      setData({
        totalRequests: 0, // Would come from usage tracking API
        computeUnits: 0,
        avgResponseTime: 0,
        successRate: 0,
        chainBreakdown,
        methodBreakdown,
        nodeLocations
      })
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const hasData = data && (data.totalRequests > 0 || data.nodeLocations.length > 0 || data.chainBreakdown.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your API usage, performance metrics, and blockchain data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : data?.totalRequests ? (
              <>
                <div className="text-2xl font-bold">
                  {data.totalRequests.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  API calls this period
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">-</div>
                <p className="text-xs text-muted-foreground">No data yet</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compute Units</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : data?.computeUnits ? (
              <>
                <div className="text-2xl font-bold">
                  {(data.computeUnits / 1000000).toFixed(2)}M
                </div>
                <p className="text-xs text-muted-foreground">
                  Units consumed
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">-</div>
                <p className="text-xs text-muted-foreground">No usage data</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : data?.avgResponseTime ? (
              <>
                <div className="text-2xl font-bold">{data.avgResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">
                  Average latency
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">-</div>
                <p className="text-xs text-muted-foreground">No latency data</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : data?.successRate ? (
              <>
                <div className="text-2xl font-bold">{data.successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Request success rate
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">-</div>
                <p className="text-xs text-muted-foreground">No success data</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Node Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Global Node Distribution
              </CardTitle>
              <CardDescription>
                Geographic distribution of your blockchain nodes
              </CardDescription>
            </div>
            {data?.nodeLocations && data.nodeLocations.length > 0 && (
              <Badge variant="secondary">
                {data.nodeLocations.length} node{data.nodeLocations.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data?.nodeLocations && data.nodeLocations.length > 0 ? (
            <NodeMap
              data={data.nodeLocations}
              width={800}
              height={400}
              className="mx-auto"
            />
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
              <Server className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">No nodes deployed yet</p>
              <p className="text-sm">Deploy nodes to see them on the map</p>
              <Button variant="outline" className="mt-4" asChild>
                <a href="/dashboard/infrastructure/nodes">Deploy a Node</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chain Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Chain Distribution</CardTitle>
            <CardDescription>API requests by blockchain network</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : data?.chainBreakdown && data.chainBreakdown.length > 0 ? (
              <DonutChart
                data={data.chainBreakdown}
                width={200}
                height={200}
                showLegend={true}
                postfix="%"
                centerValue={data.chainBreakdown.length.toString()}
                centerLabel="chains"
              />
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No chain data available</p>
                <p className="text-sm">Start making API calls to see distribution</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top API Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Top API Methods</CardTitle>
            <CardDescription>Most frequently called RPC methods</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : data?.methodBreakdown && data.totalRequests > 0 ? (
              <div className="space-y-3">
                {data.methodBreakdown.map((method, idx) => (
                  <div key={method.method} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-mono">{method.method}</span>
                      <span className="text-muted-foreground">{method.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${method.percentage}%`,
                          backgroundColor: `hsl(${220 - idx * 20}, 70%, 50%)`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No method data available</p>
                <p className="text-sm">API usage will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Analytics Data</p>
              <p className="text-sm text-muted-foreground">
                Detailed usage analytics require connection to Hanzo Datastore.
                Configure your datastore connection in settings to enable full analytics tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
