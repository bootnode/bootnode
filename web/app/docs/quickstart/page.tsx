import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocsLayout } from "@/components/docs-layout"
import { ArrowRight } from "lucide-react"
import { docsConfig } from "@/lib/docs-config"

export const metadata = {
  title: "Quickstart",
  description: `Get started with ${docsConfig.brandName} in under 5 minutes.`,
}

export default function QuickstartPage() {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">Quickstart</h1>
          <p className="text-lg text-muted-foreground">
            Get your first blockchain API call running in under 5 minutes.
          </p>
        </div>

        {/* Step 1 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">1</Badge>
            <h2 className="text-2xl font-semibold">Sign Up and Get Your API Key</h2>
          </div>
          <p className="text-muted-foreground">
            Create a free {docsConfig.brandName} account at{" "}
            <Link href={docsConfig.dashboardUrl} className="text-primary underline underline-offset-4">
              {docsConfig.dashboardUrl.replace("https://", "")}
            </Link>
            . After signing up, navigate to <strong>Settings &rarr; API Keys</strong> and
            create a new key. Copy it -- you will need it for every request.
          </p>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-3">Your API key will look like this:</p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
                <code>{`bn_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Step 2 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">2</Badge>
            <h2 className="text-2xl font-semibold">Make Your First RPC Call</h2>
          </div>
          <p className="text-muted-foreground">
            Use <code className="bg-muted px-1.5 py-0.5 rounded text-sm">curl</code> to
            call <code className="bg-muted px-1.5 py-0.5 rounded text-sm">eth_blockNumber</code>{" "}
            on Ethereum mainnet. This returns the latest block number in hexadecimal.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`curl -X POST ${docsConfig.apiUrl}/v1/rpc/ethereum/mainnet \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_blockNumber",
    "params": []
  }'`}</code>
          </pre>
          <p className="text-sm text-muted-foreground">Response:</p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x13a5e7f"
}`}</code>
          </pre>
        </section>

        {/* Step 3 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">3</Badge>
            <h2 className="text-2xl font-semibold">Install the SDK</h2>
          </div>
          <p className="text-muted-foreground">
            For TypeScript and JavaScript projects, install the official SDK:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`npm install @bootnode/sdk`}</code>
          </pre>
          <p className="text-sm text-muted-foreground">Or with other package managers:</p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`# yarn
yarn add @bootnode/sdk

# pnpm
pnpm add @bootnode/sdk

# bun
bun add @bootnode/sdk`}</code>
          </pre>
        </section>

        {/* Step 4 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">4</Badge>
            <h2 className="text-2xl font-semibold">Use the SDK in TypeScript</h2>
          </div>
          <p className="text-muted-foreground">
            Here is a complete TypeScript example that fetches the latest block number,
            gets an ETH balance, and retrieves ERC-20 token balances for a wallet.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`import { Bootnode } from "@bootnode/sdk";

const client = new Bootnode({
  apiKey: process.env.HANZO_API_KEY!,
});

// 1. Get the latest block number via JSON-RPC
async function getBlockNumber(): Promise<string> {
  const response = await client.rpc("ethereum", "mainnet", {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_blockNumber",
    params: [],
  });
  return response.result; // e.g. "0x13a5e7f"
}

// 2. Get ETH balance using JSON-RPC
async function getBalance(address: string): Promise<string> {
  const response = await client.rpc("ethereum", "mainnet", {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBalance",
    params: [address, "latest"],
  });
  return response.result; // wei in hex, e.g. "0x6f05b59d3b20000"
}

// 3. Get ERC-20 token balances via Token API
async function getTokenBalances(address: string) {
  const balances = await client.tokens.getBalances("ethereum", address);
  return balances;
  // Returns: [{ contract: "0xa0b8...", symbol: "USDC", balance: "1500.00", ... }]
}

async function main() {
  const blockNumber = await getBlockNumber();
  console.log("Latest block:", parseInt(blockNumber, 16));

  const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  const balance = await getBalance(address);
  console.log("ETH balance (wei):", BigInt(balance).toString());

  const tokens = await getTokenBalances(address);
  console.log("Token balances:", tokens);
}

main();`}</code>
          </pre>
        </section>

        {/* Step 5: Using fetch directly */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">5</Badge>
            <h2 className="text-2xl font-semibold">Using Fetch Directly</h2>
          </div>
          <p className="text-muted-foreground">
            You do not need the SDK. Every {docsConfig.brandName} API is a standard REST or JSON-RPC
            endpoint. Here is a plain <code className="bg-muted px-1.5 py-0.5 rounded text-sm">fetch</code> example:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`const API_KEY = process.env.HANZO_API_KEY;
const BASE_URL = "https://api.hanzo.ai/v1";

// JSON-RPC call
async function ethBlockNumber(): Promise<number> {
  const res = await fetch(\`\${BASE_URL}/rpc/ethereum/mainnet\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY!,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_blockNumber",
      params: [],
    }),
  });

  if (!res.ok) {
    throw new Error(\`HTTP \${res.status}: \${await res.text()}\`);
  }

  const data = await res.json();
  return parseInt(data.result, 16);
}

// REST API call - get token balances
async function getTokenBalances(address: string) {
  const res = await fetch(
    \`\${BASE_URL}/tokens/ethereum/balances/\${address}\`,
    {
      headers: { "X-API-Key": API_KEY! },
    }
  );

  if (!res.ok) {
    throw new Error(\`HTTP \${res.status}: \${await res.text()}\`);
  }

  return res.json();
}

// Usage
const blockNum = await ethBlockNumber();
console.log("Block:", blockNum);

const tokens = await getTokenBalances(
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
);
console.log("Tokens:", tokens);`}</code>
          </pre>
        </section>

        {/* Next Steps */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Next Steps</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "API Reference", href: "/docs/api", desc: "Full endpoint documentation" },
              { title: "Smart Wallets", href: "/docs/wallets/quickstart", desc: "Create ERC-4337 smart wallets" },
              { title: "Webhooks", href: "/docs/webhooks/quickstart", desc: "Real-time event notifications" },
              { title: "WebSockets", href: "/docs/websockets/quickstart", desc: "Subscribe to live blockchain data" },
              { title: "Account Abstraction", href: "/docs/aa/quickstart", desc: "ERC-4337 bundler and paymasters" },
              { title: "SDKs", href: "/docs/sdks", desc: "Client libraries for every language" },
            ].map((item) => (
              <Link
                key={item.href}
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
