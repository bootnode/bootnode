// Docs configuration - brand-aware URLs and examples
// Uses environment variables for customization

export const docsConfig = {
  // API endpoints - detected from env or defaults
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.web3.hanzo.ai",
  dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://web3.hanzo.ai",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "wss://ws.web3.hanzo.ai",

  // Example API key prefix (brand-specific)
  apiKeyPrefix: process.env.NEXT_PUBLIC_BRAND === "hanzo" ? "hz_" : "bn_",

  // Brand name for docs
  brandName: process.env.NEXT_PUBLIC_BRAND === "hanzo" ? "Hanzo Web3" : "Bootnode",
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
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "${method}",
    "params": ${params}
  }'`
}
