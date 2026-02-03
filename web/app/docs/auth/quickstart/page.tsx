import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DocsLayout } from "@/components/docs-layout"
import { ArrowRight } from "lucide-react"

export const metadata = {
  title: "Authentication",
  description: "Learn how to authenticate with the Bootnode API.",
}

export default function AuthQuickstartPage() {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">Authentication</h1>
          <p className="text-lg text-muted-foreground">
            Every request to the Bootnode API must be authenticated. This guide covers
            how to get your API key, use it in requests, handle rate limits, and manage
            errors.
          </p>
        </div>

        {/* Step 1 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">1</Badge>
            <h2 className="text-2xl font-semibold">Get Your API Key</h2>
          </div>
          <p className="text-muted-foreground">
            Sign in to your Bootnode dashboard at{" "}
            <Link href="https://dashboard.bootnode.dev" className="text-primary underline underline-offset-4">
              dashboard.bootnode.dev
            </Link>{" "}
            and navigate to <strong>Settings &rarr; API Keys</strong>.
          </p>
          <div className="space-y-3">
            <div className="border rounded-lg p-4">
              <p className="font-medium text-sm mb-2">Key types</p>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Prefix</th>
                      <th className="text-left p-3 font-medium">Environment</th>
                      <th className="text-left p-3 font-medium">Use for</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-mono text-xs">bn_live_</td>
                      <td className="p-3">Production</td>
                      <td className="p-3 text-muted-foreground">Live mainnet requests</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-xs">bn_test_</td>
                      <td className="p-3">Testnet</td>
                      <td className="p-3 text-muted-foreground">Development and testing (testnets only)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium">Security</p>
              <p className="text-sm text-muted-foreground mt-1">
                Never expose your API key in client-side code, public repositories, or browser
                network requests. Always use server-side code or environment variables.
              </p>
            </CardContent>
          </Card>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`# .env.local (Next.js, Vite, etc.)
BOOTNODE_API_KEY=bn_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Never commit this file to version control.
# Add .env.local to your .gitignore.`}</code>
          </pre>
        </section>

        {/* Step 2 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">2</Badge>
            <h2 className="text-2xl font-semibold">Use the X-API-Key Header</h2>
          </div>
          <p className="text-muted-foreground">
            The recommended authentication method. Pass your API key in the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">X-API-Key</code> header.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`# curl
curl https://api.bootnode.dev/v1/gas/ethereum/prices \\
  -H "X-API-Key: bn_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# TypeScript / fetch
const res = await fetch("https://api.bootnode.dev/v1/gas/ethereum/prices", {
  headers: {
    "X-API-Key": process.env.BOOTNODE_API_KEY!,
  },
});

# Python / requests
import requests
res = requests.get(
    "https://api.bootnode.dev/v1/gas/ethereum/prices",
    headers={"X-API-Key": "bn_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"},
)

# Go / net/http
req, _ := http.NewRequest("GET", "https://api.bootnode.dev/v1/gas/ethereum/prices", nil)
req.Header.Set("X-API-Key", "bn_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6")`}</code>
          </pre>
        </section>

        {/* Step 3 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">3</Badge>
            <h2 className="text-2xl font-semibold">Use the Authorization Bearer Header</h2>
          </div>
          <p className="text-muted-foreground">
            Alternatively, use the standard Bearer token format. Both methods are equivalent.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`# curl
curl https://api.bootnode.dev/v1/gas/ethereum/prices \\
  -H "Authorization: Bearer bn_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# TypeScript / fetch
const res = await fetch("https://api.bootnode.dev/v1/gas/ethereum/prices", {
  headers: {
    Authorization: \`Bearer \${process.env.BOOTNODE_API_KEY}\`,
  },
});

# Python / requests
import requests
res = requests.get(
    "https://api.bootnode.dev/v1/gas/ethereum/prices",
    headers={"Authorization": "Bearer bn_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"},
)`}</code>
          </pre>
        </section>

        {/* Step 4 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">4</Badge>
            <h2 className="text-2xl font-semibold">Rate Limiting</h2>
          </div>
          <p className="text-muted-foreground">
            All API responses include rate limit headers. When you exceed your limit,
            the API returns HTTP 429.
          </p>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Plan</th>
                  <th className="text-left p-3 font-medium">Requests / sec</th>
                  <th className="text-left p-3 font-medium">Requests / day</th>
                  <th className="text-left p-3 font-medium">Compute Units / sec</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">Free</td>
                  <td className="p-3">10</td>
                  <td className="p-3">100,000</td>
                  <td className="p-3">200</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Growth</td>
                  <td className="p-3">100</td>
                  <td className="p-3">5,000,000</td>
                  <td className="p-3">2,000</td>
                </tr>
                <tr>
                  <td className="p-3">Enterprise</td>
                  <td className="p-3">Custom</td>
                  <td className="p-3">Custom</td>
                  <td className="p-3">Custom</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">Response headers:</p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`X-RateLimit-Limit: 100          # Max requests per second
X-RateLimit-Remaining: 97       # Remaining in current window
X-RateLimit-Reset: 1706400000   # Unix timestamp when window resets
Retry-After: 1                  # Seconds to wait (only on 429)`}</code>
          </pre>
          <p className="text-muted-foreground">
            Different methods consume different compute units (CU). Simple reads like{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">eth_blockNumber</code> cost 1 CU,
            while archive calls like{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">eth_getStorageAt</code> with a
            historical block cost 20 CU.
          </p>
        </section>

        {/* Step 5 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">5</Badge>
            <h2 className="text-2xl font-semibold">Error Handling</h2>
          </div>
          <p className="text-muted-foreground">
            Bootnode returns structured error responses. Always check the HTTP status code
            and handle errors gracefully with retries for transient failures.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`// Robust API client with retry logic
async function bootnodeRequest(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(\`https://api.bootnode.dev/v1\${path}\`, {
      ...options,
      headers: {
        "X-API-Key": process.env.BOOTNODE_API_KEY!,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Success
    if (res.ok) {
      return res.json();
    }

    // Parse error
    const error = await res.json().catch(() => ({
      error: { code: "unknown", message: res.statusText, status: res.status },
    }));

    // Don't retry client errors (except rate limits)
    if (res.status !== 429 && res.status < 500) {
      throw new Error(
        \`Bootnode API error [\${error.error.code}]: \${error.error.message}\`
      );
    }

    // Retry with exponential backoff
    if (attempt < maxRetries) {
      const retryAfter = res.headers.get("Retry-After");
      const delay = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : baseDelay * Math.pow(2, attempt);
      console.warn(
        \`Bootnode request failed (attempt \${attempt + 1}/\${maxRetries + 1}), \` +
        \`retrying in \${delay}ms...\`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Bootnode API: max retries exceeded");
}

// Usage:
// const prices = await bootnodeRequest("/gas/ethereum/prices");
// const wallet = await bootnodeRequest("/wallets/create", {
//   method: "POST",
//   body: JSON.stringify({ owner: "0x...", chain: "base" }),
// });`}</code>
          </pre>

          <h3 className="text-lg font-semibold mt-6">Error Response Format</h3>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`// 401 Unauthorized
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid API key. Check your X-API-Key header.",
    "status": 401
  }
}

// 429 Rate Limited
{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded. Retry after 1 second.",
    "status": 429
  }
}

// 400 Bad Request
{
  "error": {
    "code": "invalid_request",
    "message": "Missing required parameter: chain",
    "status": 400
  }
}`}</code>
          </pre>
        </section>

        {/* Key Scopes */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">API Key Scopes</h2>
          <p className="text-muted-foreground">
            When creating an API key, you can restrict it to specific scopes for
            least-privilege access:
          </p>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Scope</th>
                  <th className="text-left p-3 font-medium">Access</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">rpc:read</td>
                  <td className="p-3 text-muted-foreground">JSON-RPC read methods (eth_call, eth_getBalance, etc.)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">rpc:write</td>
                  <td className="p-3 text-muted-foreground">JSON-RPC write methods (eth_sendRawTransaction)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">data:read</td>
                  <td className="p-3 text-muted-foreground">Token, NFT, and transfer APIs</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">wallets:manage</td>
                  <td className="p-3 text-muted-foreground">Create and manage smart wallets</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">webhooks:manage</td>
                  <td className="p-3 text-muted-foreground">Create, update, and delete webhooks</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">gas:manage</td>
                  <td className="p-3 text-muted-foreground">Gas policies and sponsorship</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">bundler:send</td>
                  <td className="p-3 text-muted-foreground">Submit UserOperations to the bundler</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Next Steps */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Next Steps</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Quickstart", href: "/docs/quickstart", desc: "Make your first API call" },
              { title: "API Reference", href: "/docs/api", desc: "Complete endpoint documentation" },
              { title: "SDKs", href: "/docs/sdks", desc: "Use a client library" },
              { title: "Examples", href: "/docs/examples", desc: "Common use cases" },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors group"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </DocsLayout>
  )
}
