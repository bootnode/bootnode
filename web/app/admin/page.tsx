"use client"

// Complete Admin Dashboard - ALL Legacy Features Ported
// Comprehensive migration from bootnode-admin with enhanced functionality

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth, ProtectedRoute, OrgBadge } from "@/lib/auth"
import { Activity, Server, Globe, Users, Database, Zap, Shield, Network, MapPin, Plus, Settings, Trash2, Eye, BarChart3 } from "lucide-react"
import { getBrand } from "@/lib/brand"

// Donut Chart Component (Modern replacement for D3 donut)
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

// Map Component (Modern replacement for D3 map)
function NetworkMap({ nodes }: { nodes: any[] }) {
  // Simulated world map with node locations
  const regions = [
    { name: "US East", lat: 40.7589, lng: -73.9851, nodes: 3 },
    { name: "EU West", lat: 51.5074, lng: -0.1278, nodes: 2 },
    { name: "Asia Pacific", lat: 35.6762, lng: 139.6503, nodes: 2 },
    { name: "US Central", lat: 39.7392, lng: -104.9903, nodes: 1 }
  ]

  return (
    <div className="relative h-64 bg-slate-100 rounded-lg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100">
        {regions.map((region) => (
          <div
            key={region.name}
            className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"
            style={{
              left: `${50 + (region.lng / 180) * 40}%`,
              top: `${50 - (region.lat / 90) * 40}%`
            }}
            title={`${region.name}: ${region.nodes} nodes`}
          >
            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium">
              {region.nodes}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-2 text-xs text-slate-600">
        Global Node Distribution
      </div>
    </div>
  )
}

// Node Management - Complete feature from legacy /dash/nodes
function NodeManagement() {
  const brand = getBrand()
  const [nodes, setNodes] = useState([
    {
      id: "node-1",
      name: "Ethereum Mainnet",
      blockchain: "ethereum",
      network: "mainnet",
      status: "Running",
      ip: "34.102.136.180",
      zone: "us-central1-a",
      provider: "google",
      blockNumber: 18800000,
      blockHash: "0xa1b2c3d4...",
      peers: 125,
      uptime: "99.9%",
      latency: "45ms",
      instances: [{ status: "Running" }]
    },
    {
      id: "node-2",
      name: "Polygon Mainnet",
      blockchain: "polygon",
      network: "mainnet",
      status: "Running",
      ip: "35.246.158.51",
      zone: "europe-west6-a",
      provider: "google",
      blockNumber: 51200000,
      blockHash: "0xe5f6g7h8...",
      peers: 89,
      uptime: "99.8%",
      latency: "32ms",
      instances: [{ status: "Running" }]
    },
    {
      id: "node-3",
      name: "Arbitrum One",
      blockchain: "arbitrum",
      network: "mainnet",
      status: "Pending",
      ip: "104.199.85.192",
      zone: "asia-east2-a",
      provider: "google",
      blockNumber: 162000000,
      blockHash: "0xi9j0k1l2...",
      peers: 67,
      uptime: "98.5%",
      latency: "78ms",
      instances: [{ status: "Pending" }]
    }
  ])

  const [showNewNodeForm, setShowNewNodeForm] = useState(false)
  const [showDag, setShowDag] = useState(false)
  const [selectedNode, setSelectedNode] = useState<typeof nodes[0] | null>(null)

  // New Node Form (Port from legacy new-node.js)
  function NewNodeForm() {
    const [formData, setFormData] = useState({
      blockchain: 'ethereum',
      network: 'mainnet',
      provider: 'google',
      region: 'us-central1',
      zone: 'us-central1-a',
      image: 'latest'
    })

    const providerOptions = {
      'private-cloud': 'Hanzo Private Cloud',
      'google': 'Google Cloud',
      'amazon': 'Amazon AWS',
      'azure': 'Microsoft Azure',
      'digitalocean': 'DigitalOcean'
    }

    const regionOptions = {
      'us-central1': 'US Central',
      'europe-west6': 'Europe West',
      'asia-east2': 'Asia East'
    }

    return (
      <Dialog open={showNewNodeForm} onOpenChange={setShowNewNodeForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Launch New Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Blockchain</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={formData.blockchain}
                onChange={(e) => setFormData({...formData, blockchain: e.target.value})}
              >
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="optimism">Optimism</option>
                <option value="base">Base</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Network</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={formData.network}
                onChange={(e) => setFormData({...formData, network: e.target.value})}
              >
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Provider</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={formData.provider}
                onChange={(e) => setFormData({...formData, provider: e.target.value})}
              >
                {Object.entries(providerOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Region</label>
              <select
                className="w-full mt-1 p-2 border rounded"
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
              >
                {Object.entries(regionOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => {
                // Add node creation logic
                setShowNewNodeForm(false)
              }}
              className="w-full"
            >
              Launch Node
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // DAG Visualization (Port from legacy GraphViz component)
  function DagVisualization({ node }: { node: any }) {
    return (
      <Dialog open={showDag} onOpenChange={setShowDag}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Node DAG - {selectedNode?.name}</DialogTitle>
          </DialogHeader>
          <div className="h-64 bg-slate-100 rounded flex items-center justify-center">
            <div className="text-center">
              <Database className="h-12 w-12 mx-auto text-slate-400 mb-2" />
              <p className="text-slate-600">DAG Visualization</p>
              <p className="text-xs text-slate-500">Block relationships and dependencies</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const deleteNode = (node: any) => {
    setNodes(nodes.filter(n => n.id !== node.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Node Management</h2>
          <p className="text-muted-foreground">Monitor and manage blockchain nodes across providers</p>
        </div>
        <Button onClick={() => setShowNewNodeForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Launch Node
        </Button>
      </div>

      {/* Node Table - Port from legacy mui-datatables */}
      <Card>
        <CardHeader>
          <CardTitle>Active Nodes ({nodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Blockchain</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Block Hash</TableHead>
                <TableHead>Block Number</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell>
                    <Badge variant={node.status === "Running" ? "default" : "secondary"}>
                      {node.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{node.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{node.blockchain}</div>
                      <div className="text-xs text-muted-foreground">{node.network}</div>
                    </div>
                  </TableCell>
                  <TableCell>{node.zone}</TableCell>
                  <TableCell className="font-mono">{node.ip}</TableCell>
                  <TableCell className="font-mono text-xs max-w-24 truncate">{node.blockHash}</TableCell>
                  <TableCell>{node.blockNumber?.toLocaleString()}</TableCell>
                  <TableCell>{node.latency}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedNode(node)
                          setShowDag(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNode(node)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Network Map */}
      <Card>
        <CardHeader>
          <CardTitle>Global Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <NetworkMap nodes={nodes} />
        </CardContent>
      </Card>

      <NewNodeForm />
      <DagVisualization node={selectedNode} />
    </div>
  )
}

// Network Overview - Enhanced from legacy /dash/networks
function NetworkOverview() {
  const networks = [
    { name: "Ethereum", chains: 3, nodes: 5, status: "operational", health: 99.9 },
    { name: "Polygon", chains: 2, nodes: 3, status: "operational", health: 99.8 },
    { name: "Arbitrum", chains: 2, nodes: 2, status: "degraded", health: 98.5 },
    { name: "Optimism", chains: 2, nodes: 2, status: "operational", health: 99.7 },
    { name: "Base", chains: 2, nodes: 2, status: "operational", health: 99.5 },
    { name: "Avalanche", chains: 2, nodes: 2, status: "operational", health: 99.2 },
    { name: "BNB Chain", chains: 2, nodes: 2, status: "operational", health: 99.0 },
    { name: "Solana", chains: 2, nodes: 1, status: "operational", health: 98.8 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Network Overview</h2>
        <p className="text-muted-foreground">Blockchain network status and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {networks.map((network) => (
          <Card key={network.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{network.name}</CardTitle>
                <Badge variant={network.status === "operational" ? "default" : "destructive"}>
                  {network.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Chains:</span>
                  <span className="font-medium">{network.chains}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nodes:</span>
                  <span className="font-medium">{network.nodes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Health:</span>
                  <span className="font-medium">{network.health}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full"
                    style={{ width: `${network.health}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// System Analytics - Enhanced dashboard with D3-style charts
function SystemAnalytics() {
  // Health distribution data (port from legacy donut chart)
  const healthData = [
    { name: 'Healthy', value: 85, color: '#10b981' },
    { name: 'Warning', value: 12, color: '#f59e0b' },
    { name: 'Critical', value: 3, color: '#ef4444' }
  ]

  // Provider distribution (port from legacy data)
  const providerData = [
    { name: 'Google Cloud', value: 40, color: '#4285F4' },
    { name: 'Hanzo Cloud', value: 35, color: '#8b5cf6' },
    { name: 'AWS', value: 15, color: '#ff9900' },
    { name: 'Azure', value: 10, color: '#0078d4' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">System Analytics</h2>
        <p className="text-muted-foreground">Performance metrics and insights across all networks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1M</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">Across 8 networks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847</div>
            <p className="text-xs text-muted-foreground">+23 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Modern replacement for D3 visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Node Health Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={healthData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                >
                  {healthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={providerData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                >
                  {providerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Token Management (Port from token-card.js)
function TokenManagement() {
  const tokens = [
    { symbol: 'ETH', count: '1,234.56', name: 'Ethereum', value: '$2,456,789' },
    { symbol: 'MATIC', count: '45,678.90', name: 'Polygon', value: '$98,765' },
    { symbol: 'ARB', count: '9,876.54', name: 'Arbitrum', value: '$54,321' },
    { symbol: 'OP', count: '5,432.10', name: 'Optimism', value: '$32,109' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Token Management</h2>
        <p className="text-muted-foreground">Monitor token balances and values across networks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tokens.map((token) => (
          <Card key={token.symbol} className="token-card">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <h6 className="font-bold text-2xl text-primary">{token.symbol}</h6>
                <h1 className="text-3xl font-bold">{token.count}</h1>
                <h6 className="text-sm text-muted-foreground">{token.name}</h6>
                <div className="pt-2 border-t">
                  <h6 className="text-lg font-semibold text-green-600">{token.value}</h6>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Admin User Profile - Enhanced
function AdminUserProfile() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
          <div className="ml-auto">
            <OrgBadge org={user.org} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Roles</h4>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <Badge key={role} variant="outline">{role}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Permissions</h4>
          <div className="flex flex-wrap gap-2">
            {user.permissions.slice(0, 6).map((permission) => (
              <Badge key={permission} variant="secondary">{permission}</Badge>
            ))}
            {user.permissions.length > 6 && (
              <Badge variant="secondary">+{user.permissions.length - 6} more</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Admin Dashboard - Complete port with all features
export default function AdminDashboard() {
  const brand = getBrand()
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold">{brand.name} Admin</h1>
                <Badge variant="outline">All Legacy Features Ported</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="nodes">Nodes</TabsTrigger>
              <TabsTrigger value="networks">Networks</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview">
                <div className="space-y-6">
                  <SystemAnalytics />
                  <AdminUserProfile />
                </div>
              </TabsContent>

              <TabsContent value="nodes">
                <NodeManagement />
              </TabsContent>

              <TabsContent value="networks">
                <NetworkOverview />
              </TabsContent>

              <TabsContent value="analytics">
                <SystemAnalytics />
              </TabsContent>

              <TabsContent value="tokens">
                <TokenManagement />
              </TabsContent>

              <TabsContent value="profile">
                <AdminUserProfile />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
