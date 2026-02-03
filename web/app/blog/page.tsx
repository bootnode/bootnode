import Link from "next/link"
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on blockchain infrastructure, Web3 development, account abstraction, and building at scale.",
}

const posts = [
  {
    slug: "why-multichain-is-the-future",
    title: "Why Multi-Chain Is the Future of Web3 Development",
    summary:
      "The blockchain ecosystem has fragmented into hundreds of specialized chains. Developers who embrace multi-chain architecture today will build the most resilient and accessible applications. We explore why a unified API approach is essential, how to design apps that work across chains, and the infrastructure patterns that make multi-chain development practical at scale.",
    date: "January 15, 2026",
    readTime: "8 min read",
    category: "Engineering",
    author: "Bootnode Team",
  },
  {
    slug: "account-abstraction-explained",
    title: "Account Abstraction in Production: Lessons from ERC-4337",
    summary:
      "Account abstraction promises to make blockchain wallets as easy to use as email. After helping hundreds of teams ship ERC-4337 implementations, we share what works, what does not, and how to avoid the most common pitfalls. Topics include gas sponsorship strategies, session key architecture, bundler selection, and the real-world costs of running a paymaster.",
    date: "December 20, 2025",
    readTime: "12 min read",
    category: "Tutorial",
    author: "Bootnode Team",
  },
  {
    slug: "scaling-rpc-infrastructure",
    title: "How We Scaled to 10 Billion Daily RPC Requests",
    summary:
      "Behind every blockchain application is an RPC layer handling the heavy lifting. We share the architecture and engineering decisions that allow Bootnode to serve over 10 billion API requests per day across 100+ chains with sub-100ms latency and 99.999% uptime. Topics covered include our edge caching strategy, global load balancing, automatic failover, and how we monitor the health of thousands of blockchain nodes.",
    date: "November 8, 2025",
    readTime: "15 min read",
    category: "Engineering",
    author: "Bootnode Team",
  },
  {
    slug: "webhooks-vs-polling",
    title: "Webhooks vs. Polling: The Right Way to Track Onchain Events",
    summary:
      "Most blockchain applications need to react to onchain events in real time. Developers typically choose between polling RPC endpoints or subscribing to webhooks. We compare both approaches across latency, reliability, cost, and implementation complexity, and show when each approach makes sense. Includes practical examples for tracking token transfers, NFT mints, and smart contract events.",
    date: "October 3, 2025",
    readTime: "10 min read",
    category: "Guide",
    author: "Bootnode Team",
  },
]

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="mr-1 h-3 w-3" />
              Blog
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Insights from the Bootnode team
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Deep dives into blockchain infrastructure, Web3 engineering, and the
              tools and techniques powering the next generation of decentralized
              applications.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="border-b py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <Link href="/blog" className="group block">
              <Card className="overflow-hidden transition-colors hover:border-foreground/20">
                <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 px-8 py-16">
                  <Badge className="mb-4">{posts[0].category}</Badge>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {posts[0].title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-muted-foreground">
                    {posts[0].summary}
                  </p>
                  <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {posts[0].date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {posts[0].readTime}
                    </span>
                  </div>
                  <span className="mt-6 inline-flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Read article
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* All Posts */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold tracking-tight">All Posts</h2>
            <div className="mt-8 space-y-6">
              {posts.map((post) => (
                <Link key={post.slug} href="/blog" className="group block">
                  <Card className="transition-colors hover:border-foreground/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{post.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {post.date}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {post.readTime}
                        </span>
                      </div>
                      <CardTitle className="mt-2 text-xl">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {post.summary}
                      </p>
                      <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                        Read article
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Stay up to date
            </h2>
            <p className="mt-4 text-muted-foreground">
              Get the latest articles on blockchain infrastructure and Web3 development
              delivered to your inbox. No spam, unsubscribe anytime.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Start Building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
