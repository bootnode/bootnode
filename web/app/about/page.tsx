import Link from "next/link"
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowRight,
  Blocks,
  Globe,
  Rocket,
  Shield,
  Users,
  Zap,
} from "lucide-react"
import { getBrand } from "@/lib/brand"

const brand = getBrand()

export const metadata: Metadata = {
  title: "About",
  description:
    `${brand.name} is built by Hanzo AI, a Techstars '17 company. Our mission is to make blockchain infrastructure accessible to every developer.`,
}

const values = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Developer-First",
    description:
      "Every product decision starts with the developer experience. We build the tools we wish existed when we started building on blockchain.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Reliability Above All",
    description:
      "Production applications depend on us. We engineer for 99.999% uptime with automatic failover, redundant infrastructure, and zero-downtime deployments.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Chain Agnostic",
    description:
      "The future is multi-chain. We support 100+ blockchains through a unified API so developers can build anywhere without lock-in.",
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "Ship Fast, Ship Right",
    description:
      "We believe in rapid iteration backed by rigorous engineering. Our CI/CD pipeline deploys multiple times per day with full test coverage.",
  },
]

const stats = [
  { label: "Blockchains Supported", value: "100+" },
  { label: "API Requests / Day", value: "10B+" },
  { label: "Uptime SLA", value: "99.999%" },
  { label: "Global Edge Locations", value: "50+" },
]

const milestones = [
  {
    year: "2017",
    title: "Hanzo AI Founded",
    description:
      "Hanzo AI was founded and accepted into Techstars, one of the world's leading startup accelerators. The team began building AI and commerce infrastructure for enterprise clients.",
  },
  {
    year: "2019",
    title: "Blockchain Infrastructure",
    description:
      "After experiencing the pain of unreliable RPC providers firsthand, the team began building internal blockchain node infrastructure to support their own products.",
  },
  {
    year: "2021",
    title: "Multi-Chain Expansion",
    description:
      `With the explosion of L2s and alt-L1s, the team expanded infrastructure to support dozens of chains, developing the unified API layer that would become ${brand.name}.`,
  },
  {
    year: "2023",
    title: `${brand.name} Launched`,
    description:
      `${brand.name} launched publicly, offering multi-chain RPC, Token APIs, NFT APIs, and Webhooks. The platform quickly grew to support thousands of developers and billions of monthly API calls.`,
  },
  {
    year: "2024",
    title: "Smart Wallets & Account Abstraction",
    description:
      "The platform expanded beyond node infrastructure with ERC-4337 Smart Wallets, gas sponsorship, and a full account abstraction stack, making it a complete blockchain development platform.",
  },
  {
    year: "2025",
    title: "100+ Chains",
    description:
      `${brand.name} reached support for over 100 blockchains with sub-100ms response times across all networks, solidifying its position as the most comprehensive blockchain infrastructure platform available.`,
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Blocks className="mr-1 h-3 w-3" />
              Built by Hanzo AI
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Making blockchain infrastructure{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                accessible to every developer
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              {brand.name} is built by Hanzo AI, a Techstars &apos;17 company with deep roots in
              AI, blockchain, and developer infrastructure. We believe every developer
              should be able to build on any blockchain without worrying about
              infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-b py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight">Our Mission</h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Blockchain technology has the potential to reshape finance, identity, governance,
                and countless other domains. But today, building on blockchain is still far too
                difficult. Developers face unreliable nodes, fragmented APIs, poor documentation,
                and infrastructure that breaks under load.
              </p>
              <p>
                {brand.name} exists to solve this. We provide a unified, high-performance infrastructure
                layer that abstracts away the complexity of running nodes, indexing data, and
                managing wallets across 100+ blockchains. Our goal is to make blockchain development
                as straightforward as building any other web application.
              </p>
              <p>
                We do this by combining deep blockchain expertise with enterprise-grade
                infrastructure engineering. Our platform handles billions of API requests daily
                with sub-100ms response times and 99.999% uptime, so developers can focus on
                building their applications instead of managing infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b bg-muted/30 py-16">
        <div className="container">
          <h2 className="text-2xl font-bold tracking-tight text-center">
            What We Believe
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            The principles that guide everything we build.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {values.map((value) => (
              <Card key={value.title}>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {value.icon}
                  </div>
                  <CardTitle className="mt-4">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Background */}
      <section className="border-b py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight">Our Team</h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                {brand.name} is built by the team at Hanzo AI, a company founded in 2017 and
                backed by Techstars. Our team brings together expertise from across the
                spectrum of modern technology:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Blockchain Engineering</h3>
                  </div>
                  <p className="mt-2 text-sm">
                    Core contributors to multiple Layer 1 and Layer 2 protocols with deep experience
                    in consensus mechanisms, virtual machine design, and cross-chain interoperability.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">AI & Machine Learning</h3>
                  </div>
                  <p className="mt-2 text-sm">
                    Researchers and engineers building frontier AI models, specializing in large language
                    models, multimodal systems, and AI-powered developer tools.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Infrastructure & DevOps</h3>
                  </div>
                  <p className="mt-2 text-sm">
                    Veterans of high-scale infrastructure at companies handling billions of daily
                    requests, with expertise in distributed systems, Kubernetes, and edge computing.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Developer Experience</h3>
                  </div>
                  <p className="mt-2 text-sm">
                    Product engineers obsessed with developer experience, having built SDKs, CLIs,
                    and documentation platforms used by hundreds of thousands of developers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-b bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-center">Our Journey</h2>
            <div className="mt-12 space-y-8">
              {milestones.map((milestone) => (
                <div key={milestone.year} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-card text-sm font-bold">
                      {milestone.year.slice(2)}
                    </div>
                    <div className="mt-2 h-full w-px bg-border" />
                  </div>
                  <div className="pb-8">
                    <p className="text-sm font-medium text-primary">{milestone.year}</p>
                    <h3 className="mt-1 font-semibold">{milestone.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Join us in building the future
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Whether you are a developer building on blockchain or an engineer who wants
              to help us build the infrastructure, we would love to hear from you.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/careers">We&apos;re Hiring</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
