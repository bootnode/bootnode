"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Code2,
  Coins,
  Gauge,
  Globe,
  Layers,
  Lock,
  Network,
  Rocket,
  Settings,
  Wrench,
  Zap,
} from "lucide-react"
import { getBrand } from "@/lib/brand"
import { docsConfig } from "@/lib/docs-config"

export default function RollupsProductPage() {
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
              <Layers className="mr-1 h-3 w-3" />
              Custom Rollups
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Your own chain,{" "}
              <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                your rules
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Launch a custom rollup with dedicated block space, your own gas
              token, and a built-in bridge to Ethereum. OP Stack or ZK rollup
              technology, fully managed by {brand.name}.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="xl" asChild>
                <Link href="/contact">
                  Request Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/docs/rollups">Read the Docs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-muted/30 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <StatItem label="Rollups Deployed" value="50+" />
            <StatItem label="Transactions / sec" value="2,000+" />
            <StatItem label="Gas Cost vs L1" value="~95% less" />
            <StatItem label="Time to Launch" value="<1 day" />
          </div>
        </div>
      </section>

      {/* Why a Rollup */}
      <section className="border-b py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Why launch your own rollup?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Shared blockchains impose shared constraints. When your app
                needs predictable gas costs, higher throughput, or custom
                execution rules, a dedicated rollup gives you full control
                without sacrificing Ethereum security.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  {
                    title: "Dedicated block space",
                    desc: "No competing with other apps for gas. Your users get consistent, predictable transaction costs.",
                  },
                  {
                    title: "Custom gas token",
                    desc: "Use your own ERC-20 token for gas fees. Create a closed-loop economy within your ecosystem.",
                  },
                  {
                    title: "Ethereum security",
                    desc: "All state roots are posted to Ethereum L1. Your rollup inherits the full security guarantees of Ethereum consensus.",
                  },
                  {
                    title: "Scale to millions",
                    desc: "Process 2,000+ transactions per second with sub-second finality. Scale with demand, not with gas wars.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-green-500" />
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.desc}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-center gap-6">
              <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-rose-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Blocks className="h-5 w-5 text-orange-500" />
                    OP Stack Rollup
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Battle-tested optimistic rollup technology used by Base,
                    Optimism, and Worldchain. Fraud proofs secure your chain
                    while delivering 100x cost reduction over Ethereum L1.
                    EVM-equivalent execution means any Solidity contract deploys
                    without changes.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-purple-500" />
                    ZK Rollup
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Zero-knowledge proofs provide cryptographic finality in
                    minutes instead of the 7-day challenge period of optimistic
                    rollups. Ideal for applications that require fast bridging,
                    privacy features, or provable computation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="border-b bg-muted/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything included out of the box
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {brand.name} manages the entire rollup lifecycle: sequencer, prover,
              bridge, explorer, and monitoring. You focus on your application.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Rocket className="h-6 w-6" />}
              title="Managed Sequencer"
              description={`High-availability sequencer with sub-second block times. ${brand.name} runs and monitors the sequencer so your chain stays live 24/7 with 99.99% uptime SLA.`}
            />
            <FeatureCard
              icon={<Network className="h-6 w-6" />}
              title="Built-In Bridge"
              description="Native L1-L2 bridge for ETH and ERC-20 tokens. Users can deposit and withdraw assets between Ethereum and your rollup through a standard bridge UI."
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Block Explorer"
              description="A fully-featured block explorer deployed with your rollup. Transaction search, contract verification, token tracking, and API access included."
            />
            <FeatureCard
              icon={<Coins className="h-6 w-6" />}
              title="Custom Gas Token"
              description="Configure any ERC-20 token as the gas currency on your rollup. Set fee parameters, configure fee recipients, and create token-gated access if needed."
            />
            <FeatureCard
              icon={<Code2 className="h-6 w-6" />}
              title="Developer Tools"
              description={`Full RPC endpoint, Hardhat and Foundry support, faucet for testnet tokens, and ${brand.name} Data APIs pre-configured for your chain from day one.`}
            />
            <FeatureCard
              icon={<Gauge className="h-6 w-6" />}
              title="Monitoring & Analytics"
              description="Real-time dashboards for TPS, gas usage, active addresses, and bridge volume. Alerts for sequencer health, proof submission delays, and chain reorgs."
            />
            <FeatureCard
              icon={<Wrench className="h-6 w-6" />}
              title="Config & Governance"
              description="Adjust gas limits, block time, fee parameters, and upgrade contracts through a governance dashboard. All changes are version-controlled and auditable."
            />
            <FeatureCard
              icon={<Settings className="h-6 w-6" />}
              title="Custom Precompiles"
              description="Add custom precompiled contracts for specialized operations. VRF, signature schemes, or domain-specific computation at native speed."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Account Abstraction"
              description="ERC-4337 bundler and paymaster are pre-deployed on every rollup. Your users get smart wallets and gasless transactions from day one."
            />
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-b py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From zero to mainnet in under a day
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {brand.name} handles the heavy lifting. You define the parameters, we
              deploy the infrastructure.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-4">
            <StepCard
              step="1"
              title="Configure"
              description={`Choose your rollup type (OP Stack or ZK), gas token, block time, and genesis parameters through the ${brand.name} dashboard.`}
            />
            <StepCard
              step="2"
              title="Deploy"
              description={`${brand.name} provisions the sequencer, prover, bridge contracts, and RPC infrastructure. Testnet is live within minutes.`}
            />
            <StepCard
              step="3"
              title="Test"
              description="Deploy your contracts, run integration tests, and validate performance on your dedicated testnet with full tooling support."
            />
            <StepCard
              step="4"
              title="Launch"
              description="Promote to mainnet with a single click. Bridge contracts are deployed to Ethereum L1 and your chain is live for users."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 to-rose-600 px-6 py-20 sm:px-12 sm:py-28">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:14px_24px]" />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Your chain. Your rules. Our infrastructure.
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Talk to our team about launching a custom rollup. We will help
                you choose the right architecture and get you to mainnet fast.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="xl"
                  className="bg-white text-orange-600 hover:bg-white/90"
                  asChild
                >
                  <Link href="/contact">
                    Request Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/docs/rollups">Read the Docs</Link>
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
