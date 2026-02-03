"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Building, Globe, Bell, Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"

interface OrgSettings {
  name: string
  projectId: string
  allowedOrigins: string[]
  notifications: {
    email: boolean
    webhookFailures: boolean
    rateLimitWarnings: boolean
  }
  security: {
    twoFactorRequired: boolean
    ipAllowlist: string[]
  }
}

export default function OrganizationSettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<OrgSettings>({
    name: "",
    projectId: "",
    allowedOrigins: [],
    notifications: {
      email: true,
      webhookFailures: true,
      rateLimitWarnings: true,
    },
    security: {
      twoFactorRequired: false,
      ipAllowlist: [],
    }
  })
  const [formData, setFormData] = useState({
    name: "",
    allowedOrigins: ""
  })

  function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("bootnode_token")
    const apiKey = localStorage.getItem("bootnode_api_key")
    if (token) return { "Authorization": `Bearer ${token}` }
    if (apiKey) return { "X-API-Key": apiKey }
    return {}
  }

  useEffect(() => {
    // Load initial settings
    const projectName = user?.name ? `${user.name}'s Project` : "My Project"
    setSettings(prev => ({
      ...prev,
      name: projectName,
      projectId: user?.id || ""
    }))
    setFormData({
      name: projectName,
      allowedOrigins: ""
    })
    setLoading(false)
  }, [user])

  async function handleSaveGeneral() {
    setSaving("general")
    setError(null)
    setSuccess(null)

    try {
      // In production, this would call the API
      // await fetch("http://localhost:8000/v1/organization/settings", {
      //   method: "PATCH",
      //   headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      //   body: JSON.stringify({ name: formData.name })
      // })

      setSettings(prev => ({ ...prev, name: formData.name }))
      setSuccess("general")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Failed to save settings")
    } finally {
      setSaving(null)
    }
  }

  async function handleSaveOrigins() {
    setSaving("origins")
    setError(null)
    setSuccess(null)

    try {
      const origins = formData.allowedOrigins
        .split(",")
        .map(o => o.trim())
        .filter(o => o.length > 0)

      setSettings(prev => ({ ...prev, allowedOrigins: origins }))
      setSuccess("origins")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Failed to save origins")
    } finally {
      setSaving(null)
    }
  }

  function handleNotificationToggle(key: keyof typeof settings.notifications) {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">
          Configure your organization preferences
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            General
          </CardTitle>
          <CardDescription>
            Basic organization information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Organization Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1"
              placeholder="My Organization"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Organization ID</label>
            <Input
              value={settings.projectId || "Not assigned"}
              disabled
              className="mt-1 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This ID is automatically generated and cannot be changed
            </p>
          </div>
          <Button
            onClick={handleSaveGeneral}
            disabled={saving === "general"}
          >
            {saving === "general" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : success === "general" ? (
              <><CheckCircle2 className="h-4 w-4 mr-2" />Saved!</>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Allowed Origins
          </CardTitle>
          <CardDescription>
            Configure CORS for your API keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Allowed Origins (comma-separated)</label>
            <Input
              value={formData.allowedOrigins}
              onChange={(e) => setFormData(prev => ({ ...prev, allowedOrigins: e.target.value }))}
              placeholder="https://example.com, https://app.example.com"
              className="mt-1"
            />
          </div>
          {settings.allowedOrigins.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.allowedOrigins.map((origin, idx) => (
                <Badge key={idx} variant="secondary">{origin}</Badge>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Leave empty to allow all origins (not recommended for production)
          </p>
          <Button
            onClick={handleSaveOrigins}
            disabled={saving === "origins"}
            variant="outline"
          >
            {saving === "origins" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</>
            ) : success === "origins" ? (
              <><CheckCircle2 className="h-4 w-4 mr-2" />Updated!</>
            ) : (
              "Update Origins"
            )}
          </Button>
        </CardContent>
      </Card>

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
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive alerts via email</p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={() => handleNotificationToggle("email")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Webhook Failures</p>
              <p className="text-sm text-muted-foreground">Alert on webhook delivery failures</p>
            </div>
            <Switch
              checked={settings.notifications.webhookFailures}
              onCheckedChange={() => handleNotificationToggle("webhookFailures")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Rate Limit Warnings</p>
              <p className="text-sm text-muted-foreground">Alert when approaching rate limits</p>
            </div>
            <Switch
              checked={settings.notifications.rateLimitWarnings}
              onCheckedChange={() => handleNotificationToggle("rateLimitWarnings")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Security settings and audit logs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Require 2FA for team members</p>
            </div>
            <Badge variant={settings.security.twoFactorRequired ? "default" : "secondary"}>
              {settings.security.twoFactorRequired ? "Required" : "Not Required"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">IP Allowlist</p>
              <p className="text-sm text-muted-foreground">Restrict API access to specific IPs</p>
            </div>
            <Badge variant={settings.security.ipAllowlist.length > 0 ? "default" : "secondary"}>
              {settings.security.ipAllowlist.length > 0
                ? `${settings.security.ipAllowlist.length} IP${settings.security.ipAllowlist.length !== 1 ? "s" : ""}`
                : "Disabled"}
            </Badge>
          </div>
          <Button variant="outline" disabled>
            View Audit Logs
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
