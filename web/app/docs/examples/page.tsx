import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DocsLayout } from "@/components/docs-layout"
import { ArrowRight } from "lucide-react"

export const metadata = {
  title: "Examples",
  description: "Common Bootnode API usage examples with full code snippets.",
}

export default function ExamplesPage() {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">Examples</h1>
          <p className="text-lg text-muted-foreground">
            Copy-paste code snippets for the most common blockchain development tasks.
            All examples use TypeScript with <code className="bg-muted px-1.5 py-0.5 rounded text-sm">fetch</code> --
            no SDK required.
          </p>
        </div>

        {/* Example 1: Get ETH Balance */}
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Get ETH Balance</CardTitle>
                <Badge variant="secondary">RPC</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Fetch the native ETH balance for any address on any EVM chain using
                the standard <code className="bg-muted px-1.5 py-0.5 rounded text-xs">eth_getBalance</code> RPC method.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
                <code>{`const API_KEY = process.env.BOOTNODE_API_KEY!;

async function getEthBalance(
  chain: string,
  address: string
): Promise<{ wei: string; eth: string }> {
  const res = await fetch(
    \`https://api.bootnode.dev/v1/rpc/\${chain}/mainnet\`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
    }
  );

  const data = await res.json();
  const wei = BigInt(data.result);
  const eth = (Number(wei) / 1e18).toFixed(6);
  return { wei: wei.toString(), eth };
}

// Usage
const balance = await getEthBalance(
  "ethereum",
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
);
console.log(\`Balance: \${balance.eth} ETH (\${balance.wei} wei)\`);
// => "Balance: 1234.567890 ETH (1234567890000000000000 wei)"`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Example 2: Get ERC-20 Token Balances */}
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Get ERC-20 Token Balances</CardTitle>
                <Badge variant="secondary">Token API</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Fetch all ERC-20 token balances for a wallet in a single call using the
                Token API. Returns token symbols, formatted balances, and USD values.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
                <code>{`async function getTokenBalances(chain: string, address: string) {
  const res = await fetch(
    \`https://api.bootnode.dev/v1/tokens/\${chain}/balances/\${address}\`,
    {
      headers: { "X-API-Key": process.env.BOOTNODE_API_KEY! },
    }
  );

  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}

// Usage
const data = await getTokenBalances(
  "ethereum",
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
);

for (const token of data.tokens) {
  console.log(
    \`\${token.symbol}: \${token.formatted_balance} ($\${token.usd_value})\`
  );
}
// => "USDC: 15230.50 ($15230.50)"
// => "USDT: 8500.00 ($8500.00)"
// => "LINK: 250.75 ($3761.25)"`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Example 3: Monitor Wallet Activity with Webhooks */}
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Monitor Wallet Activity with Webhooks</CardTitle>
                <Badge variant="secondary">Webhooks</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Set up a webhook to get notified whenever a specific wallet sends
                or receives any transaction.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
                <code>{`// 1. Create the webhook subscription
async function monitorWallet(address: string) {
  const res = await fetch("https://api.bootnode.dev/v1/webhooks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.BOOTNODE_API_KEY!,
    },
    body: JSON.stringify({
      url: "https://myapp.com/api/webhooks/wallet-activity",
      chain: "ethereum",
      event_type: "address_activity",
      config: {
        addresses: [address],
      },
    }),
  });

  const webhook = await res.json();
  console.log("Webhook created:", webhook.id);
  console.log("Save this secret:", webhook.signing_secret);
  return webhook;
}

// 2. Handle incoming events (Next.js API route)
// app/api/webhooks/wallet-activity/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-bootnode-signature")!;
  const timestamp = req.headers.get("x-bootnode-timestamp")!;

  // Verify signature
  const payload = \`\${timestamp}.\${body}\`;
  const expected = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");

  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  console.log(\`Activity: \${event.data.from} -> \${event.data.to}\`);
  console.log(\`Value: \${event.data.value} wei (\${event.data.asset})\`);

  // Send notification, update database, etc.
  return NextResponse.json({ received: true });
}

// Usage
await monitorWallet("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Example 4: Create a Smart Wallet */}
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create a Smart Wallet</CardTitle>
                <Badge variant="secondary">Wallets</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create an ERC-4337 smart wallet for a user. The wallet is counterfactually
                deployed and ready to receive funds immediately.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
                <code>{`async function createWallet(ownerAddress: string, chain: string) {
  const res = await fetch("https://api.bootnode.dev/v1/wallets/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.BOOTNODE_API_KEY!,
    },
    body: JSON.stringify({
      owner: ownerAddress,
      chain,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error.message);
  }

  return res.json();
}

// Usage
const wallet = await createWallet(
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "base"
);

console.log("Smart wallet address:", wallet.address);
console.log("Status:", wallet.status); // "counterfactual"
console.log("Chain:", wallet.chain);   // "base"

// The address is deterministic -- same inputs always produce the same address.
// Users can send funds to this address before the wallet is deployed on-chain.`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Example 5: Send Gasless Transaction */}
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Send a Gasless Transaction</CardTitle>
                <Badge variant="secondary">Bundler + Gas</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Send a sponsored (gasless) ERC-20 transfer via the bundler. The user
                pays zero gas -- your gas policy covers the cost.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
                <code>{`import { encodeFunctionData, parseAbi } from "viem";

const BASE_URL = "https://api.bootnode.dev/v1";
const API_KEY = process.env.BOOTNODE_API_KEY!;
const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

async function sendGaslessTransfer(params: {
  sender: string;
  tokenContract: string;
  to: string;
  amount: bigint;
  chain: string;
  policyId: string;
}) {
  // 1. Encode ERC-20 transfer
  const callData = encodeFunctionData({
    abi: parseAbi([
      "function transfer(address to, uint256 amount) returns (bool)",
    ]),
    functionName: "transfer",
    args: [params.to as \`0x\${string}\`, params.amount],
  });

  // 2. Build UserOperation
  const userOp = {
    sender: params.sender,
    nonce: "0x0",
    callData,
    callGasLimit: "0x30000",
    verificationGasLimit: "0x50000",
    preVerificationGas: "0xc350",
    maxFeePerGas: "0x59682f00",
    maxPriorityFeePerGas: "0x3b9aca00",
  };

  // 3. Get paymaster sponsorship
  const sponsorRes = await fetch(\`\${BASE_URL}/gas/sponsor\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({
      chain: params.chain,
      policy_id: params.policyId,
      user_operation: userOp,
    }),
  });
  const sponsor = await sponsorRes.json();

  // 4. Submit to bundler
  const bundlerRes = await fetch(
    \`\${BASE_URL}/bundler/\${params.chain}/mainnet\`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendUserOperation",
        params: [
          {
            ...userOp,
            paymasterAndData: sponsor.paymasterData,
            signature: "0x", // Sign with owner key in production
          },
          ENTRY_POINT,
        ],
      }),
    }
  );

  const result = await bundlerRes.json();
  return result.result; // UserOp hash
}

// Usage
const opHash = await sendGaslessTransfer({
  sender: "0x7A0b3e4C5F1234567890abcdef1234567890ABCD",
  tokenContract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  to: "0x9876543210abcdef9876543210abcdef98765432",
  amount: 10000000n, // 10 USDC (6 decimals)
  chain: "base",
  policyId: "gp_x1y2z3w4v5u6",
});
console.log("UserOp hash:", opHash);`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Example 6: Subscribe to New Blocks */}
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subscribe to New Blocks via WebSocket</CardTitle>
                <Badge variant="secondary">WebSocket</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Open a WebSocket connection and subscribe to new block headers in real-time.
                Each message includes block number, hash, timestamp, gas used, and base fee.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
                <code>{`const API_KEY = process.env.BOOTNODE_API_KEY!;

const ws = new WebSocket(
  \`wss://api.bootnode.dev/v1/ws/ethereum/mainnet?apiKey=\${API_KEY}\`
);

ws.onopen = () => {
  console.log("Connected to Bootnode WebSocket");

  // Subscribe to new block headers
  ws.send(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_subscribe",
    params: ["newHeads"],
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  // Subscription confirmation
  if (msg.id === 1) {
    console.log("Subscribed! ID:", msg.result);
    return;
  }

  // New block
  if (msg.method === "eth_subscription") {
    const block = msg.params.result;
    const blockNum = parseInt(block.number, 16);
    const gasUsed = parseInt(block.gasUsed, 16);
    const gasLimit = parseInt(block.gasLimit, 16);
    const utilization = ((gasUsed / gasLimit) * 100).toFixed(1);
    const baseFee = (parseInt(block.baseFeePerGas, 16) / 1e9).toFixed(2);

    console.log(
      \`Block \${blockNum} | \` +
      \`Gas: \${utilization}% | \` +
      \`Base fee: \${baseFee} gwei | \` +
      \`Hash: \${block.hash.slice(0, 10)}...\`
    );
  }
};

ws.onclose = () => console.log("Disconnected");
ws.onerror = (err) => console.error("Error:", err);

// Example output:
// Block 20574335 | Gas: 50.0% | Base fee: 12.50 gwei | Hash: 0xabc123...
// Block 20574336 | Gas: 67.3% | Base fee: 13.12 gwei | Hash: 0xdef456...
// Block 20574337 | Gas: 45.8% | Base fee: 12.85 gwei | Hash: 0x789abc...`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Example 7: Get NFT Collection Data */}
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Get NFT Collection Data</CardTitle>
                <Badge variant="secondary">NFT API</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Fetch collection-level metadata and a specific NFT token in a collection.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
                <code>{`const API_KEY = process.env.BOOTNODE_API_KEY!;
const BASE = "https://api.bootnode.dev/v1";

// Get collection info
async function getCollection(chain: string, contract: string) {
  const res = await fetch(
    \`\${BASE}/nfts/\${chain}/collection/\${contract}\`,
    { headers: { "X-API-Key": API_KEY } }
  );
  return res.json();
}

// Get specific NFT
async function getNFT(chain: string, contract: string, tokenId: string) {
  const res = await fetch(
    \`\${BASE}/nfts/\${chain}/metadata/\${contract}/\${tokenId}\`,
    { headers: { "X-API-Key": API_KEY } }
  );
  return res.json();
}

// Usage
const collection = await getCollection(
  "ethereum",
  "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"
);
console.log(\`\${collection.name}: \${collection.total_supply} NFTs\`);
console.log(\`Floor: \${collection.floor_price_eth} ETH\`);
// => "Bored Ape Yacht Club: 10000 NFTs"
// => "Floor: 12.50 ETH"

const nft = await getNFT(
  "ethereum",
  "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
  "1234"
);
console.log(\`\${nft.name} - Owner: \${nft.owner}\`);
for (const trait of nft.traits) {
  console.log(\`  \${trait.trait_type}: \${trait.value}\`);
}
// => "Bored Ape #1234 - Owner: 0xd8dA...6045"
// => "  Background: Aquamarine"
// => "  Fur: Dark Brown"`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Example 8: Get Gas Prices */}
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Get Real-Time Gas Prices</CardTitle>
                <Badge variant="secondary">Gas API</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Fetch current gas price estimates for any chain. Returns slow, standard,
                and fast options with estimated confirmation times.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
                <code>{`async function getGasPrices(chain: string) {
  const res = await fetch(
    \`https://api.bootnode.dev/v1/gas/\${chain}/prices\`,
    { headers: { "X-API-Key": process.env.BOOTNODE_API_KEY! } }
  );
  return res.json();
}

// Usage
const gas = await getGasPrices("ethereum");

console.log(\`Base fee: \${gas.base_fee_gwei} gwei\`);
console.log(\`Block: \${gas.block_number}\`);
console.log("");
console.log("Speed     | Max Fee    | Priority | ETA");
console.log("----------|------------|----------|--------");
console.log(
  \`Slow      | \${gas.estimates.slow.max_fee_gwei.padStart(8)} | \` +
  \`\${gas.estimates.slow.max_priority_fee_gwei.padStart(8)} | \` +
  \`\${gas.estimates.slow.estimated_seconds}s\`
);
console.log(
  \`Standard  | \${gas.estimates.standard.max_fee_gwei.padStart(8)} | \` +
  \`\${gas.estimates.standard.max_priority_fee_gwei.padStart(8)} | \` +
  \`\${gas.estimates.standard.estimated_seconds}s\`
);
console.log(
  \`Fast      | \${gas.estimates.fast.max_fee_gwei.padStart(8)} | \` +
  \`\${gas.estimates.fast.max_priority_fee_gwei.padStart(8)} | \` +
  \`\${gas.estimates.fast.estimated_seconds}s\`
);

// Output:
// Base fee: 12.50 gwei
// Block: 20574335
//
// Speed     | Max Fee    | Priority | ETA
// ----------|------------|----------|--------
// Slow      |    14.00   |     0.50 | 60s
// Standard  |    16.00   |     1.50 | 15s
// Fast      |    20.00   |     3.00 | 5s`}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        {/* Next Steps */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">More Resources</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "API Reference", href: "/docs/api", desc: "Complete endpoint documentation" },
              { title: "SDKs", href: "/docs/sdks", desc: "Use a client library" },
              { title: "Quickstart", href: "/docs/quickstart", desc: "Step-by-step setup guide" },
              { title: "Changelog", href: "/docs/changelog", desc: "Latest features and fixes" },
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
