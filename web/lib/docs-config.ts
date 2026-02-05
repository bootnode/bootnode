// Docs configuration - fully brand-aware URLs and examples
// All branding is centralized in lib/brand.ts

import { getBrand } from "./brand"

// Get current brand configuration
const brand = getBrand()

export const docsConfig = {
  // Brand info
  brandName: brand.name,
  brandTagline: brand.tagline,
  brandDescription: brand.description,

  // API endpoints - detected from env or derived from brand
  apiUrl: process.env.NEXT_PUBLIC_API_URL || `https://api.${brand.domain}`,
  dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || `https://${brand.domain}`,
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || `wss://ws.${brand.domain}`,
  zapUrl: process.env.NEXT_PUBLIC_ZAP_URL || `zap://api.${brand.domain}:9999`,
  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL || `https://docs.${brand.domain}`,
  statusUrl: brand.statusUrl,

  // API key prefix (brand-specific)
  apiKeyPrefix: brand.name.toLowerCase().startsWith("hanzo") ? "hz_"
    : brand.name.toLowerCase().startsWith("lux") ? "lux_"
    : brand.name.toLowerCase().startsWith("zoo") ? "zoo_"
    : "bn_",

  // Social links
  social: brand.social,

  // IAM configuration
  iam: brand.iam,
}

// Helper to get full API URL
export function getApiUrl(path: string = ""): string {
  return `${docsConfig.apiUrl}${path}`
}

// Helper to get dashboard URL
export function getDashboardUrl(path: string = ""): string {
  return `${docsConfig.dashboardUrl}${path}`
}

// Example curl command with brand-specific URL
export function exampleCurl(method: string, params: string = "[]"): string {
  return `curl -X POST ${docsConfig.apiUrl}/v1/rpc/ethereum/mainnet \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${docsConfig.apiKeyPrefix}YOUR_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "${method}",
    "params": ${params}
  }'`
}

// Example code snippets with brand-specific imports
export function exampleTypescript(method: string): string {
  const sdkName = docsConfig.brandName.toLowerCase().replace(/\s+/g, "-")
  return `import { createClient } from "@${sdkName}/sdk"

const client = createClient({
  apiKey: "${docsConfig.apiKeyPrefix}YOUR_API_KEY",
})

const result = await client.rpc.${method}()
console.log(result)`
}

export function examplePython(method: string): string {
  const sdkName = docsConfig.brandName.toLowerCase().replace(/\s+/g, "_")
  return `from ${sdkName} import Client

client = Client(api_key="${docsConfig.apiKeyPrefix}YOUR_API_KEY")
result = client.rpc.${method}()
print(result)`
}

// Example ZAP client snippet
export function exampleZap(): string {
  return `from hanzo_zap import Client

async with Client.connect("${docsConfig.zapUrl}") as client:
    server = await client.init({"name": "my-agent", "version": "1.0"})
    result = await client.call_tool("rpc_call", {
        "chain": "ethereum",
        "method": "eth_blockNumber"
    })
    print(f"Block: {int(result['result'], 16)}")`
}
