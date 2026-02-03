"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Fuel,
  Trash2,
  Loader2,
  X,
  DollarSign,
  Zap,
  Settings,
} from "lucide-react"
import { useGasPolicies, useCreateGasPolicy, useDeleteGasPolicy, useGasPrices } from "@/lib/hooks"

export default function GasPoliciesPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [chain, setChain] = useState("ethereum")
  const [gpNetwork, setGpNetwork] = useState("")
  const [maxGasPerOp, setMaxGasPerOp] = useState("")
  const [maxSpendPerDay, setMaxSpendPerDay] = useState("")
  const [allowedContracts, setAllowedContracts] = useState("")
  const [allowedMethods, setAllowedMethods] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [priceChain, setPriceChain] = useState("ethereum")

  const policiesQuery = useGasPolicies()
  const createPolicy = useCreateGasPolicy()
  const deletePolicy = useDeleteGasPolicy()
  const gasPricesQuery = useGasPrices(priceChain)

  const policies = Array.isArray(policiesQuery.data) ? policiesQuery.data : []
  const gasPrices = gasPricesQuery.data as { slow?: string; standard?: string; fast?: string; base_fee?: string; unit?: string } | null

  async function handleCreate() {
    if (!name.trim() || !chain.trim()) return
    try {
      await createPolicy.mutateAsync({
        name: name.trim(),
        chain: chain.trim(),
        network: gpNetwork.trim() || undefined,
        max_gas_per_op: maxGasPerOp ? parseInt(maxGasPerOp) : undefined,
        max_spend_per_day_usd: maxSpendPerDay ? parseFloat(maxSpendPerDay) : undefined,
        allowed_contracts: allowedContracts.trim()
          ? allowedContracts.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        allowed_methods: allowedMethods.trim()
          ? allowedMethods.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      })
      setName("")
      setChain("ethereum")
      setGpNetwork("")
      setMaxGasPerOp("")
      setMaxSpendPerDay("")
      setAllowedContracts("")
      setAllowedMethods("")
      setShowCreate(false)
    } catch {
      // error available via createPolicy.error
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePolicy.mutateAsync(id)
      setDeleteConfirm(null)
    } catch {
      // error available via deletePolicy.error
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gas Policies</h1>
          <p className="text-muted-foreground">
            Configure gas sponsorship and paymaster settings
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create Gas Policy</CardTitle>
            <CardDescription>Define gas sponsorship rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Policy Name</label>
                <Input
                  placeholder="e.g., Free Tier, Premium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
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
                <label className="text-sm font-medium">Network (optional)</label>
                <Input
                  placeholder="mainnet, testnet..."
                  value={gpNetwork}
                  onChange={(e) => setGpNetwork(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Gas Per Operation</label>
                <Input
                  type="number"
                  placeholder="e.g., 500000"
                  value={maxGasPerOp}
                  onChange={(e) => setMaxGasPerOp(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Spend Per Day (USD)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 50.00"
                  value={maxSpendPerDay}
                  onChange={(e) => setMaxSpendPerDay(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Allowed Contracts (comma-separated)</label>
                <Input
                  placeholder="0x..., 0x..."
                  value={allowedContracts}
                  onChange={(e) => setAllowedContracts(e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Allowed Methods (comma-separated)</label>
              <Input
                placeholder="transfer, approve, mint..."
                value={allowedMethods}
                onChange={(e) => setAllowedMethods(e.target.value)}
                className="mt-1"
              />
            </div>
            {createPolicy.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {String(createPolicy.error)}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createPolicy.isPending || !name.trim()}>
                {createPolicy.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Policy
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
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policiesQuery.isLoading ? "..." : policies.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={policiesQuery.error ? "destructive" : "default"}>
              {policiesQuery.isLoading ? "Loading" : policiesQuery.error ? "Error" : "Connected"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spending Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Connect analytics to track</p>
          </CardContent>
        </Card>
      </div>

      {/* Gas Prices */}
      <Card>
        <CardHeader>
          <CardTitle>Current Gas Prices</CardTitle>
          <CardDescription>Live gas prices for selected chain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Chain</label>
              <Input
                value={priceChain}
                onChange={(e) => setPriceChain(e.target.value)}
                placeholder="ethereum, base, polygon..."
                className="mt-1"
              />
            </div>
          </div>
          {gasPricesQuery.isLoading ? (
            <div className="text-muted-foreground text-sm">Loading gas prices...</div>
          ) : gasPricesQuery.error ? (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
              {String(gasPricesQuery.error)}
            </div>
          ) : gasPrices ? (
            <div className="grid gap-4 md:grid-cols-3">
              {gasPrices.slow !== undefined && (
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Slow</p>
                  <p className="text-lg font-bold">{gasPrices.slow}</p>
                  <p className="text-xs text-muted-foreground">{gasPrices.unit || "gwei"}</p>
                </div>
              )}
              {gasPrices.standard !== undefined && (
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Standard</p>
                  <p className="text-lg font-bold">{gasPrices.standard}</p>
                  <p className="text-xs text-muted-foreground">{gasPrices.unit || "gwei"}</p>
                </div>
              )}
              {gasPrices.fast !== undefined && (
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Fast</p>
                  <p className="text-lg font-bold">{gasPrices.fast}</p>
                  <p className="text-xs text-muted-foreground">{gasPrices.unit || "gwei"}</p>
                </div>
              )}
              {gasPrices.base_fee !== undefined && (
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Base Fee</p>
                  <p className="text-lg font-bold">{gasPrices.base_fee}</p>
                  <p className="text-xs text-muted-foreground">{gasPrices.unit || "gwei"}</p>
                </div>
              )}
              {!gasPrices.slow && !gasPrices.standard && !gasPrices.fast && !gasPrices.base_fee && (
                <div className="col-span-3">
                  <pre className="text-sm text-muted-foreground bg-muted/50 p-3 rounded overflow-auto">
                    {JSON.stringify(gasPrices, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No gas price data available.</div>
          )}
        </CardContent>
      </Card>

      {/* Policies List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Policies</CardTitle>
          <CardDescription>
            Gas sponsorship rules for your applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {policiesQuery.isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-muted-foreground">Loading policies...</div>
            </div>
          ) : policiesQuery.error ? (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
              {String(policiesQuery.error)}
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center text-muted-foreground p-12">
              No gas policies yet. Create your first one above.
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy: { id?: string; policy_id?: string; name?: string; chain?: string; network?: string; max_gas_per_op?: number; max_spend_per_day_usd?: number; allowed_contracts?: string[]; allowed_methods?: string[]; is_active?: boolean; created_at?: string }) => {
                const pId = policy.policy_id || policy.id || ""
                const isActive = policy.is_active !== false
                return (
                  <div
                    key={pId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Fuel className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{policy.name || "Unnamed"}</h4>
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "active" : "inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {policy.chain || "any"}
                          </Badge>
                          {policy.network && (
                            <Badge variant="outline" className="text-xs">
                              {policy.network}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {policy.max_spend_per_day_usd !== undefined && (
                        <div className="text-right">
                          <p className="text-sm font-medium">${policy.max_spend_per_day_usd}/day</p>
                          <p className="text-xs text-muted-foreground">spend limit</p>
                        </div>
                      )}
                      {policy.max_gas_per_op !== undefined && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{policy.max_gas_per_op.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">gas/op</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {deleteConfirm === pId ? (
                          <>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(pId)}
                              disabled={deletePolicy.isPending}
                            >
                              {deletePolicy.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteConfirm(pId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {deletePolicy.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm mt-4">
              {String(deletePolicy.error)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Types */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Types</CardTitle>
          <CardDescription>
            Choose how to sponsor gas for your users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: DollarSign, name: "Fully Sponsored", description: "Pay 100% of gas fees for your users" },
              { icon: Zap, name: "Subsidized", description: "Pay a percentage of gas, users cover the rest" },
              { icon: Settings, name: "Conditional", description: "Sponsor gas based on rules and conditions" },
            ].map((type) => (
              <div key={type.name} className="p-4 border rounded-lg">
                <type.icon className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-medium">{type.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
