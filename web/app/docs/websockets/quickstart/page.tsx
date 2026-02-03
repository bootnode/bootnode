import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DocsLayout } from "@/components/docs-layout"
import { ArrowRight } from "lucide-react"

export const metadata = {
  title: "WebSockets Quickstart",
  description: "Subscribe to real-time blockchain data with Bootnode WebSockets.",
}

export default function WebSocketsQuickstartPage() {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">WebSockets Quickstart</h1>
          <p className="text-lg text-muted-foreground">
            Subscribe to real-time blockchain events over a persistent WebSocket connection.
            Receive new blocks, logs, and pending transactions the moment they appear.
          </p>
        </div>

        {/* Subscription Types */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Subscriptions</h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Subscription</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">newHeads</td>
                  <td className="p-3 text-muted-foreground">New block headers as they are mined</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">logs</td>
                  <td className="p-3 text-muted-foreground">Smart contract event logs with optional topic/address filters</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">newPendingTransactions</td>
                  <td className="p-3 text-muted-foreground">Transaction hashes as they enter the mempool</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">syncing</td>
                  <td className="p-3 text-muted-foreground">Node sync status changes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Step 1 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">1</Badge>
            <h2 className="text-2xl font-semibold">Connect to the WebSocket Endpoint</h2>
          </div>
          <p className="text-muted-foreground">
            The WebSocket URL follows the same chain/network pattern as the REST API.
            Pass your API key as a query parameter.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`wss://api.bootnode.dev/v1/ws/{chain}/{network}?apiKey=YOUR_API_KEY

// Examples:
// wss://api.bootnode.dev/v1/ws/ethereum/mainnet?apiKey=bn_live_...
// wss://api.bootnode.dev/v1/ws/base/mainnet?apiKey=bn_live_...
// wss://api.bootnode.dev/v1/ws/polygon/mainnet?apiKey=bn_live_...`}</code>
          </pre>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`// Node.js / Browser
const ws = new WebSocket(
  "wss://api.bootnode.dev/v1/ws/ethereum/mainnet?apiKey=" +
  process.env.BOOTNODE_API_KEY
);

ws.onopen = () => {
  console.log("Connected to Bootnode WebSocket");
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = (event) => {
  console.log(\`WebSocket closed: code=\${event.code} reason=\${event.reason}\`);
};`}</code>
          </pre>
        </section>

        {/* Step 2 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">2</Badge>
            <h2 className="text-2xl font-semibold">Subscribe to New Block Headers</h2>
          </div>
          <p className="text-muted-foreground">
            The <code className="bg-muted px-1.5 py-0.5 rounded text-sm">newHeads</code> subscription
            emits a message every time a new block is mined. Each message contains the block
            header with number, hash, timestamp, gas used, and base fee.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`const ws = new WebSocket(
  "wss://api.bootnode.dev/v1/ws/ethereum/mainnet?apiKey=" +
  process.env.BOOTNODE_API_KEY
);

ws.onopen = () => {
  // Subscribe to new block headers
  ws.send(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_subscribe",
    params: ["newHeads"],
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  // Subscription confirmation
  if (message.id === 1) {
    console.log("Subscribed! ID:", message.result);
    // => "Subscribed! ID: 0x1a2b3c4d"
    return;
  }

  // New block header
  if (message.method === "eth_subscription") {
    const block = message.params.result;
    console.log("New block:", {
      number: parseInt(block.number, 16),
      hash: block.hash,
      timestamp: new Date(parseInt(block.timestamp, 16) * 1000),
      gasUsed: parseInt(block.gasUsed, 16),
      gasLimit: parseInt(block.gasLimit, 16),
      baseFeePerGas: parseInt(block.baseFeePerGas, 16) / 1e9 + " gwei",
      transactionCount: block.transactions?.length ?? "N/A",
    });
  }
};

// Example output:
// New block: {
//   number: 20574335,
//   hash: "0xabc123...",
//   timestamp: 2026-01-15T10:35:22.000Z,
//   gasUsed: 15000000,
//   gasLimit: 30000000,
//   baseFeePerGas: "12.5 gwei",
//   transactionCount: 142
// }`}</code>
          </pre>
        </section>

        {/* Step 3 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">3</Badge>
            <h2 className="text-2xl font-semibold">Subscribe to Logs with Filters</h2>
          </div>
          <p className="text-muted-foreground">
            Subscribe to smart contract events by specifying contract addresses and/or
            event topic signatures. This example monitors USDC Transfer events.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

ws.onopen = () => {
  // Subscribe to USDC Transfer events
  ws.send(JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "eth_subscribe",
    params: [
      "logs",
      {
        address: USDC_ADDRESS,
        topics: [TRANSFER_TOPIC],
      },
    ],
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.id === 2) {
    console.log("Subscribed to USDC transfers! ID:", message.result);
    return;
  }

  if (message.method === "eth_subscription") {
    const log = message.params.result;

    // Decode Transfer event
    const from = "0x" + log.topics[1].slice(26);
    const to = "0x" + log.topics[2].slice(26);
    const amount = BigInt(log.data);
    const usdc = Number(amount) / 1e6; // USDC has 6 decimals

    console.log(\`USDC Transfer: \${from} -> \${to}: \$\${usdc.toFixed(2)}\`);
    console.log(\`  Block: \${parseInt(log.blockNumber, 16)}\`);
    console.log(\`  Tx: \${log.transactionHash}\`);
  }
};

// Example output:
// USDC Transfer: 0xd8dA...6045 -> 0x9876...5432: $1500.00
//   Block: 20574335
//   Tx: 0xabc123...`}</code>
          </pre>
        </section>

        {/* Step 4 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">4</Badge>
            <h2 className="text-2xl font-semibold">Subscribe to Pending Transactions</h2>
          </div>
          <p className="text-muted-foreground">
            Monitor the mempool for new pending transactions. Useful for MEV detection,
            frontrunning protection, or real-time transaction feeds.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`ws.onopen = () => {
  // Subscribe to pending transactions
  ws.send(JSON.stringify({
    jsonrpc: "2.0",
    id: 3,
    method: "eth_subscribe",
    params: ["newPendingTransactions"],
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.id === 3) {
    console.log("Subscribed to pending txs! ID:", message.result);
    return;
  }

  if (message.method === "eth_subscription") {
    const txHash = message.params.result;
    console.log("Pending tx:", txHash);
    // => "Pending tx: 0xabc123def456..."

    // Optionally fetch full transaction details via RPC
    // ws.send(JSON.stringify({
    //   jsonrpc: "2.0",
    //   id: Date.now(),
    //   method: "eth_getTransactionByHash",
    //   params: [txHash],
    // }));
  }
};`}</code>
          </pre>
        </section>

        {/* Step 5 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">5</Badge>
            <h2 className="text-2xl font-semibold">Handle Reconnection</h2>
          </div>
          <p className="text-muted-foreground">
            WebSocket connections can drop due to network issues or server maintenance.
            Always implement reconnection logic with exponential backoff.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`class BootnodeWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions: Array<{ id: number; params: any[] }> = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;
  private onMessage: (data: any) => void;

  constructor(
    chain: string,
    network: string,
    apiKey: string,
    onMessage: (data: any) => void
  ) {
    this.url =
      \`wss://api.bootnode.dev/v1/ws/\${chain}/\${network}?apiKey=\${apiKey}\`;
    this.onMessage = onMessage;
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;

      // Re-subscribe to all previous subscriptions
      for (const sub of this.subscriptions) {
        this.ws!.send(JSON.stringify({
          jsonrpc: "2.0",
          id: sub.id,
          method: "eth_subscribe",
          params: sub.params,
        }));
      }
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data);
    };

    this.ws.onclose = (event) => {
      console.log(\`WebSocket closed: \${event.code} \${event.reason}\`);
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      // onclose will fire after onerror, triggering reconnect
    };
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached. Giving up.");
      return;
    }

    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
    const jitter = Math.random() * 1000;
    this.reconnectAttempts++;

    console.log(
      \`Reconnecting in \${delay + jitter}ms \` +
      \`(attempt \${this.reconnectAttempts}/\${this.maxReconnectAttempts})\`
    );

    setTimeout(() => this.connect(), delay + jitter);
  }

  subscribe(id: number, params: any[]) {
    this.subscriptions.push({ id, params });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        jsonrpc: "2.0",
        id,
        method: "eth_subscribe",
        params,
      }));
    }
  }

  unsubscribe(subscriptionId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "eth_unsubscribe",
        params: [subscriptionId],
      }));
    }
  }

  close() {
    this.maxReconnectAttempts = 0; // Prevent reconnection
    this.ws?.close();
  }
}

// Usage:
const client = new BootnodeWebSocket(
  "ethereum",
  "mainnet",
  process.env.BOOTNODE_API_KEY!,
  (data) => {
    if (data.method === "eth_subscription") {
      console.log("Event:", data.params.result);
    }
  }
);

// Subscribe to new blocks
client.subscribe(1, ["newHeads"]);

// Subscribe to USDC transfers
client.subscribe(2, ["logs", {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
}]);

// Clean shutdown
process.on("SIGINT", () => {
  client.close();
  process.exit(0);
});`}</code>
          </pre>
        </section>

        {/* Unsubscribe */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Unsubscribing</h2>
          <p className="text-muted-foreground">
            To stop receiving events for a subscription, send an{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">eth_unsubscribe</code> request
            with the subscription ID returned from the initial subscribe call.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`// Unsubscribe
ws.send(JSON.stringify({
  jsonrpc: "2.0",
  id: 99,
  method: "eth_unsubscribe",
  params: ["0x1a2b3c4d"], // subscription ID from eth_subscribe response
}));

// Response:
// { "jsonrpc": "2.0", "id": 99, "result": true }`}</code>
          </pre>
        </section>

        {/* Connection Limits */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Connection Limits</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Plan</th>
                      <th className="text-left p-3 font-medium">Concurrent Connections</th>
                      <th className="text-left p-3 font-medium">Subscriptions per Connection</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">Free</td>
                      <td className="p-3">2</td>
                      <td className="p-3">5</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Growth</td>
                      <td className="p-3">10</td>
                      <td className="p-3">50</td>
                    </tr>
                    <tr>
                      <td className="p-3">Enterprise</td>
                      <td className="p-3">Custom</td>
                      <td className="p-3">Custom</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Next Steps */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Next Steps</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Webhooks", href: "/docs/webhooks/quickstart", desc: "Server-side event notifications" },
              { title: "API Reference", href: "/docs/api", desc: "Full WebSocket API docs" },
              { title: "Examples", href: "/docs/examples", desc: "More streaming examples" },
              { title: "SDKs", href: "/docs/sdks", desc: "Client libraries with built-in WS" },
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
