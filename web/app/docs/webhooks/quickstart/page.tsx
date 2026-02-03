import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocsLayout } from "@/components/docs-layout"
import { ArrowRight } from "lucide-react"
import { docsConfig } from "@/lib/docs-config"

export const metadata = {
  title: "Webhooks Quickstart",
  description: `Set up real-time blockchain event notifications with ${docsConfig.brandName} Webhooks.`,
}

export default function WebhooksQuickstartPage() {
  return (
    <DocsLayout>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">Webhooks Quickstart</h1>
          <p className="text-lg text-muted-foreground">
            Receive real-time notifications when on-chain events happen. No polling required.
            {docsConfig.brandName} will POST a signed JSON payload to your endpoint whenever a matching event
            occurs.
          </p>
        </div>

        {/* Event Types */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Supported Event Types</h2>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Event Type</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">address_activity</td>
                  <td className="p-3 text-muted-foreground">Any transaction involving specified addresses (sends, receives, contract interactions)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">token_transfer</td>
                  <td className="p-3 text-muted-foreground">ERC-20 token transfers to/from specified addresses or contracts</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">nft_transfer</td>
                  <td className="p-3 text-muted-foreground">ERC-721 and ERC-1155 NFT transfers</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-mono text-xs">mined_transaction</td>
                  <td className="p-3 text-muted-foreground">Specific transaction hash has been mined and confirmed</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">log</td>
                  <td className="p-3 text-muted-foreground">Contract event logs matching specific topics and addresses</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Step 1 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">1</Badge>
            <h2 className="text-2xl font-semibold">Create a Webhook Subscription</h2>
          </div>
          <p className="text-muted-foreground">
            Register your endpoint and specify which events you want to receive.
            {docsConfig.brandName} returns a <code className="bg-muted px-1.5 py-0.5 rounded text-sm">signing_secret</code>{" "}
            that you will use to verify webhook payloads.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`curl -X POST ${docsConfig.apiUrl}/v1/webhooks \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "url": "https://myapp.com/api/webhooks/bootnode",
    "chain": "ethereum",
    "event_type": "address_activity",
    "config": {
      "addresses": [
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
      ]
    }
  }'`}</code>
          </pre>
          <p className="text-sm text-muted-foreground">Response:</p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`{
  "id": "wh_a1b2c3d4e5f6",
  "url": "https://myapp.com/api/webhooks/bootnode",
  "chain": "ethereum",
  "event_type": "address_activity",
  "config": {
    "addresses": [
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
    ]
  },
  "signing_secret": "whsec_k7m9p2q4r6s8t0v2w4x6y8z0",
  "status": "active",
  "created_at": "2026-01-15T10:30:00Z"
}`}</code>
          </pre>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium">Important</p>
              <p className="text-sm text-muted-foreground mt-1">
                Save the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">signing_secret</code> securely.
                It is only returned once during creation. You will need it to verify incoming webhook signatures.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Step 2 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">2</Badge>
            <h2 className="text-2xl font-semibold">Set Up Your Webhook Endpoint</h2>
          </div>
          <p className="text-muted-foreground">
            Create an Express.js server (or any HTTP server) to receive webhook events.
            {docsConfig.brandName} sends POST requests with a JSON body and an HMAC signature in the headers.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`// server.ts
import express from "express";
import crypto from "crypto";

const app = express();
const SIGNING_SECRET = process.env.WEBHOOK_SIGNING_SECRET!;
// "whsec_k7m9p2q4r6s8t0v2w4x6y8z0"

// IMPORTANT: Use raw body for signature verification
app.post(
  "/api/webhooks/bootnode",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-bootnode-signature"] as string;
    const timestamp = req.headers["x-bootnode-timestamp"] as string;
    const body = req.body as Buffer;

    // 1. Verify the signature
    if (!verifySignature(body, signature, timestamp)) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // 2. Parse the event
    const event = JSON.parse(body.toString());
    console.log("Received event:", event.event_type, event.data);

    // 3. Handle the event
    switch (event.event_type) {
      case "address_activity":
        handleAddressActivity(event.data);
        break;
      case "token_transfer":
        handleTokenTransfer(event.data);
        break;
      case "nft_transfer":
        handleNftTransfer(event.data);
        break;
      default:
        console.log("Unhandled event type:", event.event_type);
    }

    // 4. Return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  }
);

app.listen(3001, () => {
  console.log("Webhook server listening on port 3001");
});`}</code>
          </pre>
        </section>

        {/* Step 3 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">3</Badge>
            <h2 className="text-2xl font-semibold">Verify the HMAC Signature</h2>
          </div>
          <p className="text-muted-foreground">
            Every webhook request includes two headers for verification:{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">X-Bootnode-Signature</code> and{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">X-Bootnode-Timestamp</code>.
            The signature is a HMAC-SHA256 hex digest of{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{`{timestamp}.{body}`}</code>.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`function verifySignature(
  body: Buffer,
  signature: string,
  timestamp: string
): boolean {
  // 1. Reject old timestamps (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (Math.abs(now - ts) > 300) {
    // 5-minute tolerance
    return false;
  }

  // 2. Compute expected signature
  const payload = \`\${timestamp}.\${body.toString()}\`;
  const expected = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(payload)
    .digest("hex");

  // 3. Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}</code>
          </pre>
        </section>

        {/* Step 4 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full h-8 w-8 flex items-center justify-center text-sm">4</Badge>
            <h2 className="text-2xl font-semibold">Handle Event Types</h2>
          </div>
          <p className="text-muted-foreground">
            Each event type has a specific payload structure. Here are handlers for the
            most common event types:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`interface AddressActivityEvent {
  chain: string;
  block_number: number;
  tx_hash: string;
  from: string;
  to: string;
  value: string;           // wei as decimal string
  asset: string;           // "ETH" or token symbol
  contract: string | null; // null for native transfers
  direction: "incoming" | "outgoing";
}

function handleAddressActivity(data: AddressActivityEvent) {
  console.log(
    \`[\${data.chain}] \${data.direction} \${data.asset}: \` +
    \`\${data.from} -> \${data.to} (\${data.value} wei)\`
  );

  // Example: notify user of incoming transfer
  if (data.direction === "incoming") {
    notifyUser(data.to, \`Received \${data.asset} from \${data.from}\`);
  }
}

interface TokenTransferEvent {
  chain: string;
  block_number: number;
  tx_hash: string;
  contract: string;
  from: string;
  to: string;
  value: string;
  symbol: string;
  decimals: number;
}

function handleTokenTransfer(data: TokenTransferEvent) {
  const formatted = (
    Number(BigInt(data.value)) / Math.pow(10, data.decimals)
  ).toFixed(data.decimals);
  console.log(
    \`[\${data.chain}] Token transfer: \${formatted} \${data.symbol}\`
  );
}

interface NftTransferEvent {
  chain: string;
  block_number: number;
  tx_hash: string;
  contract: string;
  from: string;
  to: string;
  token_id: string;
  standard: "ERC721" | "ERC1155";
  quantity: number; // always 1 for ERC721
}

function handleNftTransfer(data: NftTransferEvent) {
  console.log(
    \`[\${data.chain}] NFT transfer: #\${data.token_id} \` +
    \`(\${data.standard}) from \${data.from} to \${data.to}\`
  );
}

function notifyUser(address: string, message: string) {
  // Your notification logic (email, push, in-app, etc.)
  console.log(\`Notify \${address}: \${message}\`);
}`}</code>
          </pre>
        </section>

        {/* Example Payload */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Example Webhook Payload</h2>
          <p className="text-muted-foreground">
            Here is a full example of what {docsConfig.brandName} sends to your endpoint:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
            <code>{`// Headers:
// X-Bootnode-Signature: 5a2f8c9d1e3b4a6f7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b
// X-Bootnode-Timestamp: 1706400000
// Content-Type: application/json

// Body:
{
  "id": "evt_z9y8x7w6v5u4",
  "event_type": "address_activity",
  "webhook_id": "wh_a1b2c3d4e5f6",
  "created_at": "2026-01-15T10:35:22Z",
  "data": {
    "chain": "ethereum",
    "block_number": 20574335,
    "tx_hash": "0xabc123def456789...",
    "from": "0x1234567890abcdef1234567890abcdef12345678",
    "to": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "value": "1000000000000000000",
    "asset": "ETH",
    "contract": null,
    "direction": "incoming"
  }
}`}</code>
          </pre>
        </section>

        {/* Retry Policy */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Retry Policy</h2>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                If your endpoint returns a non-2xx status code or does not respond within 15 seconds,
                {docsConfig.brandName} retries the delivery with exponential backoff:
              </p>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Attempt</th>
                      <th className="text-left p-3 font-medium">Delay</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b"><td className="p-3">1st retry</td><td className="p-3">10 seconds</td></tr>
                    <tr className="border-b"><td className="p-3">2nd retry</td><td className="p-3">1 minute</td></tr>
                    <tr className="border-b"><td className="p-3">3rd retry</td><td className="p-3">10 minutes</td></tr>
                    <tr className="border-b"><td className="p-3">4th retry</td><td className="p-3">1 hour</td></tr>
                    <tr><td className="p-3">5th retry</td><td className="p-3">6 hours</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground">
                After 5 failed retries, the webhook is paused and you receive an email notification.
                You can resume it from the dashboard or via the PATCH endpoint.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Next Steps */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Next Steps</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "API Reference", href: "/docs/api", desc: "Full webhook API endpoints" },
              { title: "WebSockets", href: "/docs/websockets/quickstart", desc: "Real-time streaming alternative" },
              { title: "Smart Wallets", href: "/docs/wallets/quickstart", desc: "Monitor smart wallet activity" },
              { title: "Examples", href: "/docs/examples", desc: "More webhook use cases" },
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
