import Link from "next/link"
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowRight,
  Check,
  HelpCircle,
  Minus,
  Zap,
} from "lucide-react"
import { getBrand } from "@/lib/brand"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for blockchain infrastructure. Start free with 30M compute units per month.",
}

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For hobbyists and developers exploring blockchain.",
    cta: "Start for free",
    ctaHref: "/dashboard",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: [
      "30M Compute Units/month",
      "25 requests/second",
      "5 apps",
      "5 webhooks",
      "Standard support (48hr response)",
      "All mainnets & testnets",
      "Core APIs (Node, Debug, Trace)",
      "Enhanced APIs (NFT, Token, Webhooks, Transfers)",
    ],
  },
  {
    name: "Pay As You Go",
    price: "$0.40-0.45",
    period: "/1M CUs",
    description: "For teams shipping production apps. Pay only for what you use.",
    cta: "Start building",
    ctaHref: "/dashboard",
    ctaVariant: "default" as const,
    highlighted: true,
    features: [
      "Unlimited CUs (pay for what you use)",
      "300 requests/second",
      "30 apps",
      "100 webhooks",
      "Priority support (24hr response)",
      "All features from Free",
      "Transaction Simulation",
      "Private Transactions",
      "Smart Wallets SDK",
      "Gas Manager (8% admin fee)",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with mission-critical infrastructure.",
    cta: "Contact sales",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: [
      "Custom throughput",
      "Unlimited apps & webhooks",
      "VIP eng support (5min response)",
      "Volume discounts",
      "SLAs",
      "Priority on product roadmaps",
      "Custom Gas Manager fee",
    ],
  },
]

type FeatureValue = boolean | string

interface FeatureRow {
  feature: string
  free: FeatureValue
  payg: FeatureValue
  enterprise: FeatureValue
}

interface FeatureCategory {
  category: string
  features: FeatureRow[]
}

const featureComparison: FeatureCategory[] = [
  {
    category: "Core APIs",
    features: [
      { feature: "Node API", free: true, payg: true, enterprise: true },
      { feature: "Debug API", free: true, payg: true, enterprise: true },
      { feature: "Trace API", free: true, payg: true, enterprise: true },
    ],
  },
  {
    category: "Enhanced APIs",
    features: [
      { feature: "NFT API", free: true, payg: true, enterprise: true },
      { feature: "Token API", free: true, payg: true, enterprise: true },
      { feature: "Webhooks", free: true, payg: true, enterprise: true },
      { feature: "Transfers API", free: true, payg: true, enterprise: true },
      { feature: "Smart Websockets", free: true, payg: true, enterprise: true },
    ],
  },
  {
    category: "Transactions",
    features: [
      { feature: "Transaction Simulation", free: false, payg: true, enterprise: true },
      { feature: "Private Transactions", free: false, payg: true, enterprise: true },
      { feature: "Smart Wallets SDK", free: false, payg: true, enterprise: true },
      { feature: "Bundler API", free: false, payg: true, enterprise: true },
      { feature: "Gas Manager", free: false, payg: "8% fee", enterprise: "Custom fee" },
    ],
  },
  {
    category: "Pricing & Limits",
    features: [
      { feature: "Compute Units", free: "30M/month", payg: "Unlimited", enterprise: "Custom" },
      { feature: "CU Rate", free: "Included", payg: "$0.40-0.45/1M", enterprise: "Volume discounts" },
      { feature: "Throughput", free: "25 req/s", payg: "300 req/s", enterprise: "Custom" },
      { feature: "Apps", free: "5", payg: "30", enterprise: "Unlimited" },
      { feature: "Webhooks", free: "5", payg: "100", enterprise: "Unlimited" },
    ],
  },
  {
    category: "Tools",
    features: [
      { feature: "SDK Access", free: true, payg: true, enterprise: true },
      { feature: "API Composer", free: true, payg: true, enterprise: true },
      { feature: "Block Explorer", free: true, payg: true, enterprise: true },
      { feature: "Usage Analytics", free: true, payg: true, enterprise: true },
      { feature: "Custom Alerts", free: false, payg: true, enterprise: true },
    ],
  },
  {
    category: "Support",
    features: [
      { feature: "Documentation", free: true, payg: true, enterprise: true },
      { feature: "Community Discord", free: true, payg: true, enterprise: true },
      { feature: "Email Support", free: "48hr response", payg: "24hr response", enterprise: "5min response" },
      { feature: "Dedicated Account Manager", free: false, payg: false, enterprise: true },
      { feature: "SLA Guarantee", free: false, payg: false, enterprise: true },
    ],
  },
]

const faqs = [
  {
    question: "What is a compute unit?",
    answer:
      "A compute unit (CU) is our universal unit of measurement for API usage. Different API methods consume different amounts of CUs based on their computational complexity. For example, a simple eth_blockNumber call costs 1 CU, while eth_getLogs may cost 10-100 CUs depending on the block range. This ensures fair, predictable pricing across all chains and methods.",
  },
  {
    question: "How do I get started?",
    answer:
      "Getting started is easy. Sign up for a free account, create an API key from your dashboard, and start making requests immediately. No credit card required. You get 30M compute units per month free to build and test your applications.",
  },
  {
    question: "When do I get billed?",
    answer:
      "Free tier users are never billed. Pay As You Go users are billed monthly based on their compute unit usage above the free allocation. You can set spending limits and alerts to control costs. Enterprise customers have custom billing arrangements.",
  },
  {
    question: "How can I upgrade to Enterprise?",
    answer:
      "Contact our sales team to discuss your requirements. Enterprise plans include custom throughput limits, volume discounts, SLAs, dedicated support with 5-minute response times, and priority access to new features. We will work with you to create a plan that fits your needs.",
  },
]

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return <Check className="h-5 w-5 text-green-500 mx-auto" />
  }
  if (value === false) {
    return <Minus className="h-5 w-5 text-muted-foreground mx-auto" />
  }
  return <span className="text-sm">{value}</span>
}

export default function PricingPage() {
  const brand = getBrand()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Zap className="mr-1 h-3 w-3" />
              Simple Pricing
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Start free, scale as you grow
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Transparent pricing with no hidden fees. Get 30M compute units free every month.
              Pay only for what you use beyond that.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.highlighted
                    ? "relative border-primary shadow-lg"
                    : ""
                }
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.period && (
                      <span className="text-muted-foreground">{tier.period}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant={tier.ctaVariant}
                    asChild
                  >
                    <Link href={tier.ctaHref}>
                      {tier.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Separator className="my-6" />
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold tracking-tight text-center">
              Compare Plans
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              See all features available across each plan.
            </p>
            <div className="mt-8 overflow-hidden rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[300px]">Feature</TableHead>
                    <TableHead className="text-center">Free</TableHead>
                    <TableHead className="text-center">Pay As You Go</TableHead>
                    <TableHead className="text-center">Enterprise</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureComparison.map((category) => (
                    <>
                      <TableRow key={category.category} className="bg-muted/30">
                        <TableCell
                          colSpan={4}
                          className="font-semibold text-sm py-2"
                        >
                          {category.category}
                        </TableCell>
                      </TableRow>
                      {category.features.map((row) => (
                        <TableRow key={row.feature}>
                          <TableCell className="text-sm">{row.feature}</TableCell>
                          <TableCell className="text-center">
                            <FeatureCell value={row.free} />
                          </TableCell>
                          <TableCell className="text-center">
                            <FeatureCell value={row.payg} />
                          </TableCell>
                          <TableCell className="text-center">
                            <FeatureCell value={row.enterprise} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <HelpCircle className="mx-auto mb-4 h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="mt-12 space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to start building?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get 30M compute units free every month. No credit card required.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
