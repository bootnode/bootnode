"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Blocks, Loader2 } from "lucide-react"
import { useAuth, HanzoLoginButton } from "@/lib/auth"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading, isProduction, login, register } = useAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [name, setName] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [mode, setMode] = React.useState<"login" | "register">("login")

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && user) {
      const returnUrl = searchParams.get("returnUrl") || "/dashboard"
      router.push(returnUrl)
    }
  }, [user, authLoading, router, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (mode === "register") {
        await register(email, password, name)
      } else {
        await login(email, password)
      }
      const returnUrl = searchParams.get("returnUrl") || "/dashboard"
      router.push(returnUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Production mode: Show IAM login options
  if (isProduction) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
        <Link href="/" className="mb-8 flex items-center space-x-2">
          <Blocks className="h-8 w-8" />
          <span className="text-2xl font-bold">Bootnode</span>
        </Link>

        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign in to Bootnode</CardTitle>
            <CardDescription>
              Choose your identity provider to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <HanzoLoginButton org="hanzo" />
              <Button variant="outline" className="w-full" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_IAM_URL || "https://iam.hanzo.ai"}/oauth2/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_IAM_CLIENT_ID || "bootnode-platform"}&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/callback")}&scope=openid+profile+email&state=zoo`}>
                Continue with Zoo ID
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_IAM_URL || "https://iam.hanzo.ai"}/oauth2/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_IAM_CLIENT_ID || "bootnode-platform"}&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/callback")}&scope=openid+profile+email&state=lux`}>
                Lux ID
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_IAM_URL || "https://iam.hanzo.ai"}/oauth2/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_IAM_CLIENT_ID || "bootnode-platform"}&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/callback")}&scope=openid+profile+email&state=pars`}>
                Pars ID
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Development mode: Show email/password form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <Link href="/" className="mb-8 flex items-center space-x-2">
        <Blocks className="h-8 w-8" />
        <span className="text-2xl font-bold">Bootnode</span>
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {mode === "login" ? "Sign in" : "Create account"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Enter your credentials to access the dashboard"
              : "Create a new account to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {mode === "register" && (
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required={mode === "register"}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  mode === "login" ? "Sign in" : "Create account"
                )}
              </Button>
            </form>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Development mode - local authentication
          </p>

          {/* Demo credentials for localhost */}
          <div className="mt-3 rounded-md border border-dashed border-muted-foreground/25 bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <code
                  className="font-mono bg-background px-1 rounded cursor-pointer hover:bg-primary/10"
                  onClick={() => setEmail("test@bootnode.dev")}
                  title="Click to use"
                >
                  test@bootnode.dev
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Password:</span>
                <code
                  className="font-mono bg-background px-1 rounded cursor-pointer hover:bg-primary/10"
                  onClick={() => setPassword("testpass123")}
                  title="Click to use"
                >
                  testpass123
                </code>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Click values to autofill. Or register a new account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
