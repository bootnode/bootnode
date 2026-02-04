"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Activity,
  ArrowRight,
  Bell,
  Blocks,
  CheckCircle2,
  Clock,
  Filter,
  Key,
  MailCheck,
  RefreshCw,
  Shield,
  TestTube,
  Webhook,
  Zap,
} from "lucide-react"
import { getBrand } from "@/lib/brand"
import { docsConfig } from "@/lib/docs-config"

export default function WebhooksProductPage() {
  const brand = getBrand()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="container relative py-24 md:py-32 lg:py-40">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <Badge variant="secondary" className="mb-4">
              <Webhook className="mr-1 h-3 w-3" />
              Real-Time Webhooks
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Never miss an{" "}
              <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                onchain event
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Get instant HTTP POST notifications for blockchain events. Address
              activity, token transfers, NFT mints, new blocks, and more.
              HMAC-signed, retried automatically, and delivered in milliseconds.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="xl" asChild>
                <Link href="/dashboard/webhooks">
                  Create a Webhook
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/docs/webhooks">Read the Docs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-muted/30 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <StatItem label="Events Delivered / Day" value="500M+" />
            <StatItem label="Avg. Delivery" value="<200ms" />
            <StatItem label="Delivery Success" value="99.98%" />
            <StatItem label="Event Types" value="7" />
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="border-b py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Seven event types for every use case
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Subscribe to exactly the events your application needs. Each
              webhook can monitor one or more event types with custom filters.
            </p>
          </div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <EventTypeCard
              name="ADDRESS_ACTIVITY"
              description="Fires when a monitored address sends or receives any transaction, including native transfers, ERC-20 transfers, and contract interactions."
              useCases="Wallet notifications, activity feeds, compliance monitoring"
            />
            <EventTypeCard
              name="MINED_TRANSACTION"
              description="Fires when a specific transaction hash is included in a block. Use this to track transactions you have submitted and notify users of confirmation."
              useCases="Transaction confirmation, payment processing"
            />
            <EventTypeCard
              name="NFT_ACTIVITY"
              description="Fires on ERC-721 and ERC-1155 transfer events. Covers mints, transfers, and burns. Includes full token metadata in the payload."
              useCases="NFT marketplace alerts, collection tracking, mint monitoring"
            />
            <EventTypeCard
              name="TOKEN_TRANSFER"
              description="Fires on ERC-20 token transfer events. Filter by token address, sender, receiver, or minimum value to reduce noise."
              useCases="DeFi monitoring, whale alerts, treasury tracking"
            />
            <EventTypeCard
              name="INTERNAL_TRANSFER"
              description="Fires on internal (trace-level) ETH transfers that do not appear in standard transaction logs. Captures contract-to-contract value movement."
              useCases="MEV detection, protocol revenue tracking, audit trails"
            />
            <EventTypeCard
              name="NEW_BLOCK"
              description="Fires when a new block is mined on the monitored chain. Payload includes block number, hash, timestamp, gas used, and transaction count."
              useCases="Block explorers, chain monitoring, sequencer health checks"
            />
            <EventTypeCard
              name="PENDING_TRANSACTION"
              description="Fires when a transaction enters the mempool for monitored addresses. Get ahead of block confirmation for real-time UX updates."
              useCases="Pending state UI, front-running detection, gas estimation"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b bg-muted/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for production reliability
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Webhooks are critical infrastructure. {brand.name} delivers them with
              the reliability and security your application demands.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="HMAC-SHA256 Signing"
              description={`Every webhook payload is signed with your secret key using HMAC-SHA256. Verify the X-${brand.name.replace(/\s+/g, "-")}-Signature header to confirm authenticity and prevent spoofing.`}
            />
            <FeatureCard
              icon={<RefreshCw className="h-6 w-6" />}
              title="Automatic Retries"
              description="Failed deliveries are retried with exponential backoff: 1s, 5s, 30s, 5m, 30m, 2h, 8h. Up to 7 retry attempts over 10 hours before the event is marked as failed."
            />
            <FeatureCard
              icon={<Filter className="h-6 w-6" />}
              title="Custom Filters"
              description="Narrow down events with filters on address, token contract, minimum value, function selector, or topic hash. Receive only the events that matter to your app."
            />
            <FeatureCard
              icon={<TestTube className="h-6 w-6" />}
              title="Test Endpoint"
              description="Send a test event to your webhook URL from the dashboard. Verify your handler processes the payload correctly before going live with real onchain events."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Delivery Logs"
              description="Full delivery history with request/response details, latency, and status codes. Debug failed deliveries and monitor endpoint health from the dashboard."
            />
            <FeatureCard
              icon={<Activity className="h-6 w-6" />}
              title="Real-Time Dashboard"
              description="Monitor delivery rates, success/failure metrics, and event volume in real time. Set up alerts for delivery failures or endpoint downtime."
            />
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="border-b py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple to set up, simple to verify
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Create a webhook from the dashboard or API. When an event fires,
                {brand.name} sends a JSON POST to your URL. Verify the HMAC
                signature and process the event.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "JSON payloads with consistent schema across all event types",
                  "Idempotency key in every payload for safe deduplication",
                  "Timestamps in ISO 8601 with block-level precision",
                  "Chain ID and network name included in every event",
                  "Webhook management via REST API or dashboard UI",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <CodeBlock
                title="Webhook Payload"
                brandName={brand.name}
              />
              <CodeBlock2
                title="Verify Signature (Node.js)"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b bg-muted/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How webhooks work
            </h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-4">
            <StepCard
              step="1"
              title="Create"
              description="Define your webhook in the dashboard or via API. Choose event types, add address or token filters, and provide your endpoint URL."
            />
            <StepCard
              step="2"
              title="Listen"
              description={`${brand.name} monitors the blockchain in real time. When an event matches your filters, a signed JSON payload is queued for delivery.`}
            />
            <StepCard
              step="3"
              title="Deliver"
              description="The payload is POST-ed to your endpoint with HMAC signature headers. Your server responds with 2xx to acknowledge receipt."
            />
            <StepCard
              step="4"
              title="Retry"
              description={`If delivery fails, ${brand.name} retries with exponential backoff up to 7 times. Failed events are visible in your delivery log dashboard.`}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-20 sm:px-12 sm:py-28">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:14px_24px]" />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Stop polling. Start streaming.
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Set up your first webhook in under a minute. Free tier includes
                1,000 webhook deliveries per day across all event types.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="xl"
                  className="bg-white text-pink-600 hover:bg-white/90"
                  asChild
                >
                  <Link href="/dashboard/webhooks">
                    Create Your First Webhook
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/docs/webhooks">View Full Docs</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold md:text-3xl">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function EventTypeCard({
  name,
  description,
  useCases,
}: {
  name: string
  description: string
  useCases: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <Badge variant="outline" className="w-fit font-mono text-xs">
          {name}
        </Badge>
        <CardTitle className="mt-2 text-base">{name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bNft\b/, "NFT")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div>
          <span className="text-xs font-medium text-muted-foreground">
            Use cases:{" "}
          </span>
          <span className="text-xs text-muted-foreground">{useCases}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string
  title: string
  description: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {step}
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function CodeBlock({ title, brandName }: { title: string; brandName: string }) {
  const headerName = `X-${brandName.replace(/\s+/g, "-")}-Signature`
  const code = `POST /your-endpoint HTTP/1.1
Content-Type: application/json
${headerName}: sha256=a1b2c3d4e5...
X-Webhook-Event: TOKEN_TRANSFER
X-Webhook-Idempotency-Key: evt_01HZ3K...

{
  "id": "evt_01HZ3KQWERTY...",
  "type": "TOKEN_TRANSFER",
  "createdAt": "2025-01-15T14:23:01.456Z",
  "chain": "ethereum",
  "chainId": 1,
  "data": {
    "blockNumber": 19234567,
    "transactionHash": "0x3a1b...",
    "logIndex": 42,
    "from": "0xd8dA6BF2...",
    "to": "0x7a250d56...",
    "token": {
      "address": "0xA0b8...ec7",
      "symbol": "USDC",
      "decimals": 6
    },
    "value": "50000000000",
    "valueFormatted": "50000.0"
  }
}`
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center border-b px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function CodeBlock2({ title }: { title: string }) {
  const code = `import crypto from "node:crypto";

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const sig = signature.replace("sha256=", "");
  return crypto.timingSafeEqual(
    Buffer.from(sig, "hex"),
    Buffer.from(expected, "hex")
  );
}`
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center border-b px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}
