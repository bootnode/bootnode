"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  ArrowRight,
  Building2,
  Mail,
  MessageSquare,
  Send,
} from "lucide-react"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <MessageSquare className="mr-1 h-3 w-3" />
              Get in Touch
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Contact Us
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Have a question about Bootnode? Want to discuss enterprise pricing?
              Need help with your integration? We are here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Fill out the form below and we will get back to you within one business day.
                  </p>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                        <Send className="h-6 w-6 text-green-500" />
                      </div>
                      <h3 className="text-lg font-semibold">Message sent</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Thank you for reaching out. Our team will review your message and
                        respond within one business day.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-6"
                        onClick={() => setSubmitted(false)}
                      >
                        Send another message
                      </Button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        setSubmitted(true)
                      }}
                      className="space-y-4"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="name"
                            className="mb-1.5 block text-sm font-medium"
                          >
                            Name
                          </label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Your name"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="mb-1.5 block text-sm font-medium"
                          >
                            Email
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@company.com"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="company"
                          className="mb-1.5 block text-sm font-medium"
                        >
                          Company
                        </label>
                        <Input
                          id="company"
                          name="company"
                          placeholder="Your company (optional)"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="subject"
                          className="mb-1.5 block text-sm font-medium"
                        >
                          Subject
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="What is this about?"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="message"
                          className="mb-1.5 block text-sm font-medium"
                        >
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={5}
                          placeholder="Tell us how we can help..."
                          required
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Send Message
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Email</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    For general inquiries and support:
                  </p>
                  <a
                    href="mailto:support@bootnode.dev"
                    className="mt-1 block text-sm font-medium text-primary hover:underline"
                  >
                    support@bootnode.dev
                  </a>
                  <p className="mt-4 text-sm text-muted-foreground">
                    For sales and enterprise pricing:
                  </p>
                  <a
                    href="mailto:sales@bootnode.dev"
                    className="mt-1 block text-sm font-medium text-primary hover:underline"
                  >
                    sales@bootnode.dev
                  </a>
                  <p className="mt-4 text-sm text-muted-foreground">
                    For security reports:
                  </p>
                  <a
                    href="mailto:security@bootnode.dev"
                    className="mt-1 block text-sm font-medium text-primary hover:underline"
                  >
                    security@bootnode.dev
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Company</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Bootnode is built by Hanzo AI, Inc.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Techstars &apos;17
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    San Francisco, CA
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Community</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <a
                      href="https://twitter.com/bootaborode"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-muted-foreground hover:text-foreground"
                    >
                      Twitter / X - @bootnode
                    </a>
                    <a
                      href="https://discord.gg/bootnode"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-muted-foreground hover:text-foreground"
                    >
                      Discord - Join our developer community
                    </a>
                    <a
                      href="https://github.com/hanzoai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-muted-foreground hover:text-foreground"
                    >
                      GitHub - Open source projects
                    </a>
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-lg border bg-muted/30 p-6">
                <h3 className="font-semibold">Need help now?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Check our documentation for guides, API references, and troubleshooting.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/docs">
                    View Documentation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
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
