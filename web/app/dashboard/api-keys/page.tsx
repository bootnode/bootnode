"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Copy,
  Trash2,
  Key,
  Check,
  X,
  Loader2,
} from "lucide-react"
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from "@/lib/hooks"

function getProjectId(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("bootnode_project_id") || ""
}

export default function ApiKeysPage() {
  const [projectId, setProjectId] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyRateLimit, setNewKeyRateLimit] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [projectInput, setProjectInput] = useState("")

  useEffect(() => {
    setProjectId(getProjectId())
  }, [])

  const keysQuery = useApiKeys(projectId)
  const createKey = useCreateApiKey()
  const deleteKey = useDeleteApiKey()

  const keys = Array.isArray(keysQuery.data) ? keysQuery.data : []

  function handleSetProject() {
    if (!projectInput.trim()) return
    localStorage.setItem("bootnode_project_id", projectInput.trim())
    setProjectId(projectInput.trim())
  }

  async function handleCreate() {
    if (!newKeyName.trim() || !projectId) return
    try {
      await createKey.mutateAsync({
        project_id: projectId,
        name: newKeyName.trim(),
        rate_limit: newKeyRateLimit ? parseInt(newKeyRateLimit) : undefined,
      })
      setNewKeyName("")
      setNewKeyRateLimit("")
      setShowCreate(false)
    } catch {
      // error is available via createKey.error
    }
  }

  async function handleDelete(keyId: string) {
    try {
      await deleteKey.mutateAsync(keyId)
      setDeleteConfirm(null)
    } catch {
      // error is available via deleteKey.error
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!projectId) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys and access credentials
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Set Project ID</CardTitle>
            <CardDescription>
              Enter your project ID to view and manage API keys. If you used the dev seed, check the API logs for the project ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Project ID (e.g., proj_...)"
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetProject()}
              />
              <Button onClick={handleSetProject}>Set Project</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys and access credentials
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>Generate a new key for your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Key Name</label>
                <Input
                  placeholder="e.g., Production, Development"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rate Limit (req/min, optional)</label>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  value={newKeyRateLimit}
                  onChange={(e) => setNewKeyRateLimit(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            {createKey.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {String(createKey.error)}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createKey.isPending || !newKeyName.trim()}>
                {createKey.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Key
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {keysQuery.isLoading ? "..." : keys.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Project ID</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm text-muted-foreground break-all">{projectId}</code>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={keysQuery.error ? "destructive" : "default"}>
              {keysQuery.isLoading ? "Loading" : keysQuery.error ? "Error" : "Connected"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Use these keys to authenticate your API requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keysQuery.isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-muted-foreground">Loading API keys...</div>
            </div>
          ) : keysQuery.error ? (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
              {String(keysQuery.error)}
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center text-muted-foreground p-12">
              No API keys yet. Create your first one above.
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((key: { id?: string; key_id?: string; name?: string; prefix?: string; key_prefix?: string; created_at?: string; is_active?: boolean; status?: string; rate_limit?: number }) => {
                const keyId = key.key_id || key.id || ""
                const prefix = key.key_prefix || key.prefix || keyId.slice(0, 12)
                const isActive = key.is_active !== false && key.status !== "revoked"
                return (
                  <div
                    key={keyId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{key.name || "Unnamed Key"}</h4>
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "active" : "revoked"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm text-muted-foreground font-mono">
                            {prefix}{"..."}
                          </code>
                          <button
                            onClick={() => handleCopy(prefix, keyId)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Copy key prefix"
                          >
                            {copiedId === keyId ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {key.rate_limit && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{key.rate_limit}/min</p>
                          <p className="text-xs text-muted-foreground">rate limit</p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="text-xs">
                          {key.created_at
                            ? new Date(key.created_at).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {deleteConfirm === keyId ? (
                          <>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(keyId)}
                              disabled={deleteKey.isPending}
                            >
                              {deleteKey.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Confirm"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteConfirm(keyId)}
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
          {deleteKey.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm mt-4">
              {String(deleteKey.error)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Key Permissions</CardTitle>
          <CardDescription>
            Configure what each API key can access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Read Access</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Query blockchain data, account balances, transaction history
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Write Access</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Send transactions, deploy contracts, execute operations
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Webhook Management</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Create, update, and delete webhook subscriptions
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Admin Access</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Manage API keys, billing, and project settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
