import Link from "next/link"
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowRight,
  Briefcase,
  Globe,
  Heart,
  MapPin,
  Rocket,
  Zap,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join Bootnode and help build the infrastructure powering the next generation of blockchain applications. We are hiring engineers, DevRel, and more.",
}

const positions = [
  {
    title: "Senior Backend Engineer",
    department: "Engineering",
    location: "Remote (US/EU)",
    type: "Full-time",
    description:
      "Design and build the core infrastructure that powers Bootnode's multi-chain RPC platform, data indexing pipelines, and webhook delivery system. You will work on high-throughput distributed systems handling billions of daily requests across 100+ blockchain networks.",
    requirements: [
      "5+ years of experience in Go or Python with a focus on backend systems",
      "Deep understanding of distributed systems, databases, and message queues",
      "Experience with blockchain node operations or RPC infrastructure is strongly preferred",
      "Proficiency with PostgreSQL, Redis, and event-driven architectures",
      "Comfort operating production infrastructure on Kubernetes",
      "Strong opinions on reliability, observability, and incident response",
    ],
  },
  {
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote (US/EU)",
    type: "Full-time",
    description:
      "Build the Bootnode dashboard, developer portal, and documentation platform. You will create the interfaces that thousands of developers use daily to manage API keys, monitor usage, configure webhooks, and deploy smart wallets.",
    requirements: [
      "5+ years of experience with React and TypeScript",
      "Strong experience with Next.js, server components, and modern React patterns",
      "Eye for design and deep care about developer experience",
      "Experience building dashboards, data visualizations, and complex forms",
      "Familiarity with Tailwind CSS and component libraries like Radix UI",
      "Interest in or experience with blockchain/Web3 applications",
    ],
  },
  {
    title: "Developer Relations Engineer",
    department: "DevRel",
    location: "Remote (Global)",
    type: "Full-time",
    description:
      "Be the bridge between Bootnode and our developer community. You will write technical content, build sample applications, speak at conferences, and gather feedback that directly shapes our product roadmap. This role combines engineering skill with communication talent.",
    requirements: [
      "3+ years of software engineering experience with a public portfolio of technical writing",
      "Deep familiarity with blockchain development (Ethereum, Solana, or other ecosystems)",
      "Experience creating tutorials, guides, and video content for developer audiences",
      "Comfort presenting at meetups, conferences, and on livestreams",
      "Active presence in developer communities (Twitter/X, Discord, GitHub)",
      "Ability to write clean, well-documented code in TypeScript and/or Python",
    ],
  },
  {
    title: "Solutions Architect",
    department: "Sales Engineering",
    location: "Remote (US/EU)",
    type: "Full-time",
    description:
      "Work directly with enterprise customers to design and implement blockchain infrastructure solutions. You will translate complex technical requirements into architecture recommendations, lead proof-of-concept implementations, and ensure successful integrations at scale.",
    requirements: [
      "7+ years of experience in solutions architecture or senior engineering roles",
      "Strong understanding of blockchain infrastructure, RPC, indexing, and wallet systems",
      "Experience working with enterprise customers in pre-sales and post-sales capacities",
      "Ability to communicate complex technical concepts to both engineers and executives",
      "Familiarity with cloud infrastructure (AWS, GCP) and networking concepts",
      "Track record of building trust with technical stakeholders",
    ],
  },
]

const benefits = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Remote-First",
    description:
      "Work from anywhere in the world. We are a distributed team spanning multiple continents and time zones, with async communication as our default.",
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Health & Wellness",
    description:
      "Comprehensive health, dental, and vision insurance for US employees. International team members receive a generous health stipend.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Equipment & Setup",
    description:
      "A $3,000 equipment budget for your home office setup, plus a $100/month stipend for internet, coworking, or other work-related expenses.",
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "Equity & Compensation",
    description:
      "Competitive salary benchmarked against top-tier startups, meaningful equity grants, and annual compensation reviews.",
  },
  {
    icon: <Briefcase className="h-6 w-6" />,
    title: "Flexible PTO",
    description:
      "Unlimited paid time off with a minimum of 3 weeks strongly encouraged. We believe rest makes better engineers.",
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Team Retreats",
    description:
      "Twice-yearly team retreats in cities around the world. Past locations include Tokyo, Lisbon, and Denver.",
  },
]

export default function CareersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Briefcase className="mr-1 h-3 w-3" />
              We&apos;re Hiring
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Build the infrastructure that{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                powers Web3
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Join a small, high-impact team building blockchain infrastructure used by
              thousands of developers worldwide. We are remote-first, engineering-driven,
              and backed by Techstars.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b py-16">
        <div className="container">
          <h2 className="text-2xl font-bold tracking-tight text-center">
            Why Bootnode
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            We take care of our team so they can focus on building great infrastructure.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {benefit.icon}
                  </div>
                  <CardTitle className="mt-4">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold tracking-tight">Open Positions</h2>
            <p className="mt-2 text-muted-foreground">
              We are looking for exceptional people to join our team. If you do not see a
              role that fits but are passionate about blockchain infrastructure, reach out
              anyway at{" "}
              <a
                href="mailto:careers@bootnode.dev"
                className="text-primary hover:underline"
              >
                careers@bootnode.dev
              </a>
              .
            </p>
            <div className="mt-8 space-y-6">
              {positions.map((position) => (
                <Card key={position.title}>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-xl">{position.title}</CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{position.department}</Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {position.location}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {position.type}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <a href={`mailto:careers@bootnode.dev?subject=Application: ${position.title}`}>
                          Apply
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {position.description}
                    </p>
                    <h4 className="mt-4 text-sm font-semibold">Requirements</h4>
                    <ul className="mt-2 space-y-1.5">
                      {position.requirements.map((req) => (
                        <li
                          key={req}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Do not see the right role?
            </h2>
            <p className="mt-4 text-muted-foreground">
              We are always interested in hearing from talented people. Send us your
              resume and tell us what you would build at Bootnode.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <a href="mailto:careers@bootnode.dev">
                  Send Your Resume
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">Learn About Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
