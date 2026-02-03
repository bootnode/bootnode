"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Webhook,
  CheckCircle,
  XCircle,
  Trash2,
  Play,
  Pause,
  Loader2,
  X,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useWebhookDeliveries,
} from "@/lib/hooks"

function DeliveriesPanel({ webhookId }: { webhookId: string }) {
  const deliveriesQuery = useWebhookDeliveries(webhookId)
  const deliveries = Array.isArray(deliveriesQuery.data) ? deliveriesQuery.data : []

  if (deliveriesQuery.isLoading) {
    return <div className="text-sm text-muted-foreground py-2">Loading deliveries...</div>
  }
  if (deliveriesQuery.error) {
    return <div className="text-sm text-destructive py-2">{String(deliveriesQuery.error)}</div>
  }
  if (deliveries.length === 0) {
    return <div className="text-sm text-muted-foreground py-2">No deliveries yet.</div>
  }

  return (
    <div className="space-y-2 mt-2">
      {deliveries.slice(0, 10).map((d: { id?: string; status_code?: number; success?: boolean; created_at?: string; response_time_ms?: number }, i: number) => (
        <div key={d.id || i} className="flex items-center justify-between text-sm border rounded p-2">
          <div className="flex items-center gap-2">
            {d.success || (d.status_code && d.status_code < 400) ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <XCircle className="h-3 w-3 text-red-500" />
            )}
            <span>Status: {d.status_code || "N/A"}</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground text-xs">
            {d.response_time_ms !== undefined && <span>{d.response_time_ms}ms</span>}
            {d.created_at && <span>{new Date(d.created_at).toLocaleString()}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function WebhooksPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [whChain, setWhChain] = useState("ethereum")
  const [eventType, setEventType] = useState("transfer")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  const webhooksQuery = useWebhooks()
  const createWebhook = useCreateWebhook()
  const updateWebhook = useUpdateWebhook()
  const deleteWebhook = useDeleteWebhook()
  const testWebhook = useTestWebhook()

  const webhooks = Array.isArray(webhooksQuery.data) ? webhooksQuery.data : []

  async function handleCreate() {
    if (!name.trim() || !url.trim()) return
    try {
      await createWebhook.mutateAsync({
        name: name.trim(),
        url: url.trim(),
        chain: whChain.trim(),
        event_type: eventType.trim(),
      })
      setName("")
      setUrl("")
      setWhChain("ethereum")
      setEventType("transfer")
      setShowCreate(false)
    } catch {
      // error available via createWebhook.error
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await updateWebhook.mutateAsync({ id, is_active: !currentActive })
    } catch {
      // error available via updateWebhook.error
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteWebhook.mutateAsync(id)
      setDeleteConfirm(null)
    } catch {
      // error available via deleteWebhook.error
    }
  }

  async function handleTest(id: string) {
    setTestingId(id)
    try {
      await testWebhook.mutateAsync(id)
    } catch {
      // error available via testWebhook.error
    } finally {
      setTestingId(null)
    }
  }

  const activeCount = webhooks.filter((w: { is_active?: boolean }) => w.is_active !== false).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Subscribe to blockchain events and receive real-time notifications
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Webhook
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Webhook</CardTitle>
            <CardDescription>Subscribe to blockchain events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g., Transfer Notifications"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  placeholder="https://your-api.com/webhooks"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Chain</label>
                <Input
                  placeholder="ethereum, polygon, base..."
                  value={whChain}
                  onChange={(e) => setWhChain(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Event Type</label>
                <Input
                  placeholder="transfer, approval, swap..."
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            {createWebhook.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {String(createWebhook.error)}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createWebhook.isPending || !name.trim() || !url.trim()}>
                {createWebhook.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Webhook
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
            <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhooksQuery.isLoading ? "..." : webhooks.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhooksQuery.isLoading ? "..." : activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivery Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Connect analytics to track</p>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Webhooks</CardTitle>
          <CardDescription>
            Manage your webhook endpoints and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooksQuery.isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-muted-foreground">Loading webhooks...</div>
            </div>
          ) : webhooksQuery.error ? (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
              {String(webhooksQuery.error)}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center text-muted-foreground p-12">
              No webhooks yet. Create your first one above.
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook: { id?: string; webhook_id?: string; name?: string; url?: string; chain?: string; event_type?: string; is_active?: boolean; created_at?: string }) => {
                const whId = webhook.webhook_id || webhook.id || ""
                const isActive = webhook.is_active !== false
                const isExpanded = expandedId === whId
                return (
                  <div key={whId} className="border rounded-lg">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Webhook className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{webhook.name || "Unnamed"}</h4>
                            <Badge variant={isActive ? "default" : "secondary"}>
                              {isActive ? "active" : "paused"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {webhook.url || "N/A"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {webhook.chain || "any"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {webhook.event_type || "all"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTest(whId)}
                          disabled={testingId === whId}
                          title="Test webhook"
                        >
                          {testingId === whId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpandedId(isExpanded ? null : whId)}
                          title="View deliveries"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggle(whId, isActive)}
                          disabled={updateWebhook.isPending}
                          title={isActive ? "Pause" : "Resume"}
                        >
                          {isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        {deleteConfirm === whId ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(whId)}
                              disabled={deleteWebhook.isPending}
                            >
                              {deleteWebhook.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteConfirm(whId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t pt-3">
                        <h5 className="text-sm font-medium mb-2">Recent Deliveries</h5>
                        <DeliveriesPanel webhookId={whId} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {(updateWebhook.error || deleteWebhook.error || testWebhook.error) && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm mt-4">
              {String(updateWebhook.error || deleteWebhook.error || testWebhook.error)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Events</CardTitle>
          <CardDescription>
            Choose which blockchain events to subscribe to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "transfer", description: "ERC-20 token transfers" },
              { name: "nft_transfer", description: "ERC-721/ERC-1155 transfers" },
              { name: "approval", description: "Token approvals" },
              { name: "swap", description: "DEX swap events" },
              { name: "liquidity", description: "LP add/remove events" },
              { name: "mint", description: "Token/NFT minting" },
              { name: "burn", description: "Token/NFT burning" },
              { name: "contract_call", description: "Contract interactions" },
            ].map((event) => (
              <div key={event.name} className="p-3 border rounded-lg">
                <code className="text-sm font-medium text-primary">{event.name}</code>
                <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
