"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Building,
  Bell,
  Shield,
  Key,
  Trash2,
  Save,
  Server,
  Check,
  Eye,
  EyeOff,
  LogOut,
  User,
} from "lucide-react"
import { useAuth, OrgBadge } from "@/lib/auth"

export default function SettingsPage() {
  const { user, logout, isProduction } = useAuth()
  const [projectId, setProjectId] = useState("")
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [apiUrl, setApiUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    setProjectId(localStorage.getItem("bootnode_project_id") || "")
    setProjectName(localStorage.getItem("bootnode_project_name") || "")
    setProjectDescription(localStorage.getItem("bootnode_project_description") || "")
    setApiKey(localStorage.getItem("bootnode_api_key") || "")
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  }, [])

  function handleSaveProject() {
    if (typeof window === "undefined") return
    if (projectId) localStorage.setItem("bootnode_project_id", projectId)
    if (projectName) localStorage.setItem("bootnode_project_name", projectName)
    if (projectDescription) localStorage.setItem("bootnode_project_description", projectDescription)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleSaveApiKey() {
    if (typeof window === "undefined") return
    if (apiKey) localStorage.setItem("bootnode_api_key", apiKey)
    setApiKeySaved(true)
    setTimeout(() => setApiKeySaved(false), 2000)
  }

  function handleClearSettings() {
    if (typeof window === "undefined") return
    localStorage.removeItem("bootnode_project_id")
    localStorage.removeItem("bootnode_project_name")
    localStorage.removeItem("bootnode_project_description")
    localStorage.removeItem("bootnode_api_key")
    setProjectId("")
    setProjectName("")
    setProjectDescription("")
    setApiKey("")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and project settings
        </p>
      </div>

      {/* Account Info */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium">{user.name}</h4>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <OrgBadge org={user.org} />
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign out
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Roles</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Auth Mode</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {isProduction ? "Hanzo IAM (Production)" : "Local Auth (Development)"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key
          </CardTitle>
          <CardDescription>
            Optional API key for direct API access (bypasses user auth)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">API Key</label>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="bn_..."
                  className="font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={handleSaveApiKey} disabled={!apiKey}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
            {apiKeySaved && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <Check className="h-4 w-4" /> API key saved
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              API keys can be created from the API Keys page.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            API Connection
          </CardTitle>
          <CardDescription>
            Backend API configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">API URL</label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={apiUrl} disabled className="font-mono text-sm" />
                <Badge variant="default">Connected</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Project ID</label>
              <Input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Enter your project ID"
                className="mt-1 font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Project Settings
          </CardTitle>
          <CardDescription>
            Configure your project details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Project Name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Blockchain App"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Production blockchain infrastructure"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveProject}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            {saved && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure alert and notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Usage Alerts", description: "When approaching rate limits" },
              { name: "Webhook Failures", description: "When deliveries fail" },
              { name: "Security Alerts", description: "Suspicious activity detected" },
              { name: "Billing Updates", description: "Invoices and payment status" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Badge variant="secondary">Available</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Security settings and access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">IP Allowlist</h4>
                <p className="text-sm text-muted-foreground">
                  Restrict API access to specific IPs
                </p>
              </div>
              <Badge variant="secondary">Available</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Domain Verification</h4>
                <p className="text-sm text-muted-foreground">
                  Verify ownership of your domains
                </p>
              </div>
              <Badge variant="secondary">Available</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Audit Logs</h4>
                <p className="text-sm text-muted-foreground">
                  View all account activity
                </p>
              </div>
              <Badge variant="secondary">Available</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
            <div>
              <h4 className="font-medium">Clear Local Settings</h4>
              <p className="text-sm text-muted-foreground">
                Remove project ID, API key, and settings from local storage
              </p>
            </div>
            <Button variant="destructive" onClick={handleClearSettings}>
              Clear Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
