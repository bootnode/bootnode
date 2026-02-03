import Link from "next/link"
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowRight,
  Check,
  HelpCircle,
  Zap,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for blockchain infrastructure. Start free with 100M compute units per month.",
}

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For hobbyists and developers exploring blockchain. Get started with no commitment.",
    cta: "Start Building Free",
    ctaHref: "/dashboard",
    ctaVariant: "outline" as const,
    highlighted: false,
    limits: [
      "100M compute units / month",
      "5 API keys",
      "3 chains",
      "Community support",
      "Standard rate limits",
      "7-day data retention",
    ],
  },
  {
    name: "Growth",
    price: "$99",
    period: "/month",
    description: "For teams shipping production apps. Everything you need to scale with confidence.",
    cta: "Get Started",
    ctaHref: "/dashboard",
    ctaVariant: "default" as const,
    highlighted: true,
    limits: [
      "1B compute units / month",
      "Unlimited API keys",
      "All 100+ chains",
      "Email support (< 24h response)",
      "Enhanced rate limits",
      "30-day data retention",
      "Webhook delivery guarantees",
      "Team members (up to 10)",
      "Usage analytics dashboard",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with mission-critical infrastructure and compliance requirements.",
    cta: "Contact Sales",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
    highlighted: false,
    limits: [
      "Custom compute units",
      "Dedicated infrastructure",
      "99.999% uptime SLA",
      "Custom chain support",
      "24/7 priority support",
      "90-day data retention",
      "Dedicated account manager",
      "Custom rate limits",
      "SOC 2 compliance reports",
      "SSO / SAML authentication",
      "Unlimited team members",
      "Private networking (VPC peering)",
    ],
  },
]

const faqs = [
  {
    question: "What is a compute unit?",
    answer:
      "A compute unit (CU) is Bootnode's universal unit of measurement for API usage. Different API methods consume different amounts of CUs based on their computational complexity. For example, a simple eth_blockNumber call costs 1 CU, while eth_getLogs may cost 10-100 CUs depending on the range. This ensures fair pricing across all chains and methods.",
  },
  {
    question: "Can I switch plans at any time?",
    answer:
      "Yes. You can upgrade or downgrade your plan at any time from your dashboard. When upgrading, the new plan takes effect immediately and you are billed a prorated amount for the remainder of the billing cycle. When downgrading, the change takes effect at the start of the next billing cycle.",
  },
  {
    question: "What happens if I exceed my compute unit limit?",
    answer:
      "On the Free plan, requests are rate-limited once you reach your monthly allocation. On the Growth plan, you can enable overage billing at $0.10 per million additional CUs so your app never goes down. Enterprise plans include custom overage arrangements.",
  },
  {
    question: "Do you offer annual billing?",
    answer:
      "Yes. Annual billing is available for the Growth plan at $79/month (a 20% discount). Enterprise plans are custom-quoted with flexible billing terms. Contact our sales team for details.",
  },
  {
    question: "Which chains are available on each plan?",
    answer:
      "The Free plan gives you access to any 3 chains of your choice. The Growth and Enterprise plans include all 100+ supported chains with no restrictions. You can change your selected chains on the Free plan at any time.",
  },
  {
    question: "What kind of support do you offer?",
    answer:
      "The Free plan includes access to our community Discord and documentation. The Growth plan includes email support with a guaranteed response time of under 24 hours during business hours. Enterprise plans include 24/7 priority support with a dedicated account manager and Slack channel.",
  },
  {
    question: "Is there a free trial for the Growth plan?",
    answer:
      "The Free plan serves as a generous trial with 100M compute units per month. There is no time limit -- you can use the Free plan indefinitely. When you are ready to scale, upgrading to Growth takes one click.",
  },
  {
    question: "Do you offer discounts for startups?",
    answer:
      "Yes. We offer a startup program that provides Growth plan access at no cost for 6 months for qualifying early-stage startups. Apply through our startup program page or contact sales for details.",
  },
]

export default function PricingPage() {
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
              Start free, scale without limits
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Transparent pricing with no hidden fees. Every plan includes access to
              our full API suite: RPC, Token API, NFT API, Webhooks, Smart Wallets, and more.
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
                    {tier.limits.map((limit) => (
                      <li key={limit} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        <span className="text-sm">{limit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compute Unit Table */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-center">
              Compute Unit Costs
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Each API method uses a specific number of compute units. Here are some common examples.
            </p>
            <div className="mt-8 overflow-hidden rounded-lg border bg-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Method</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">CUs</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { method: "eth_blockNumber", cus: "1" },
                    { method: "eth_getBalance", cus: "5" },
                    { method: "eth_call", cus: "10" },
                    { method: "eth_getTransactionReceipt", cus: "10" },
                    { method: "eth_getLogs (100 blocks)", cus: "25" },
                    { method: "eth_getBlockByNumber (full)", cus: "50" },
                    { method: "debug_traceTransaction", cus: "200" },
                    { method: "Token API - Get balances", cus: "5" },
                    { method: "NFT API - Get collection", cus: "10" },
                    { method: "Webhook - Create", cus: "50" },
                  ].map((row) => (
                    <tr key={row.method} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-sm">{row.method}</td>
                      <td className="px-4 py-3 text-right text-sm">{row.cus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              Get 100M compute units free every month. No credit card required.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Start Building Free
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
