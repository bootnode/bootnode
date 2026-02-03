import Link from "next/link"
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowRight,
  FileKey2,
  KeyRound,
  Lock,
  Network,
  Shield,
  ShieldCheck,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Security",
  description:
    "Bootnode's security practices: SOC 2 compliance, data encryption, API key hashing, HMAC webhook signing, rate limiting, and responsible disclosure.",
}

const practices = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "SOC 2 Type II Compliance",
    description:
      "Bootnode has completed SOC 2 Type II certification, independently verifying that our systems and processes meet the highest standards for security, availability, processing integrity, confidentiality, and privacy. Our SOC 2 report is available to enterprise customers under NDA.",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Data Encryption",
    description:
      "All data is encrypted in transit using TLS 1.3 with modern cipher suites. Data at rest is encrypted using AES-256-GCM. Database backups, logs, and any stored blockchain data are fully encrypted. We enforce HSTS and certificate transparency for all public endpoints.",
  },
  {
    icon: <KeyRound className="h-6 w-6" />,
    title: "API Key Security",
    description:
      "API keys are hashed using bcrypt before storage. We never store plaintext API keys in our database. Keys are displayed only once at creation time. You can restrict keys by IP address, HTTP referrer, and specific API methods. Key rotation is supported with zero downtime.",
  },
  {
    icon: <FileKey2 className="h-6 w-6" />,
    title: "HMAC Webhook Signing",
    description:
      "Every webhook delivery includes an HMAC-SHA256 signature in the X-Bootnode-Signature header, computed using a per-webhook signing secret. This allows you to cryptographically verify that webhook payloads originated from Bootnode and have not been tampered with in transit.",
  },
  {
    icon: <Network className="h-6 w-6" />,
    title: "Rate Limiting & DDoS Protection",
    description:
      "All API endpoints are protected by multi-layer rate limiting at the edge, application, and per-key levels. Our infrastructure is fronted by enterprise-grade DDoS protection capable of absorbing volumetric attacks exceeding 1 Tbps. Adaptive rate limiting automatically adjusts to abnormal traffic patterns.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Infrastructure Security",
    description:
      "Our infrastructure runs on hardened, purpose-built systems with minimal attack surface. All systems are patched within 24 hours of critical CVE disclosure. We use network segmentation, least-privilege IAM policies, and immutable infrastructure patterns. No engineer has standing access to production systems -- all access requires just-in-time approval with full audit logging.",
  },
]

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Shield className="mr-1 h-3 w-3" />
              Security
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Security at Bootnode
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              We take security seriously. Bootnode is SOC 2 Type II certified and
              implements defense-in-depth across every layer of our infrastructure.
              Your API keys, data, and webhook payloads are protected by
              industry-leading security practices.
            </p>
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl space-y-6">
            {practices.map((practice) => (
              <Card key={practice.title}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {practice.icon}
                    </div>
                    <CardTitle>{practice.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {practice.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Measures */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold tracking-tight">
              Additional Security Measures
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold">Penetration Testing</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  We conduct annual third-party penetration tests covering our API
                  endpoints, dashboard application, and infrastructure. Critical findings
                  are remediated within 48 hours. Pentest reports are available to
                  enterprise customers under NDA.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold">Dependency Management</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Automated dependency scanning runs on every pull request using
                  Dependabot and Snyk. Critical vulnerabilities in dependencies are
                  patched within 24 hours. We maintain a software bill of materials (SBOM)
                  for all production services.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold">Access Controls</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  All employees use hardware security keys for authentication. Production
                  access requires multi-party approval and is logged immutably. We enforce
                  least-privilege access across all systems and conduct quarterly access
                  reviews.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold">Incident Response</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  We maintain a documented incident response plan with defined severity
                  levels, escalation paths, and communication procedures. All security
                  incidents are reviewed in post-incident reviews. Critical incidents are
                  communicated to affected customers within 24 hours.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold">Data Retention</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  API request logs are retained for 30 days on Growth plans and 90 days
                  on Enterprise plans. Webhook delivery logs are retained for the same
                  period. You can request deletion of your data at any time by contacting
                  support.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold">Compliance</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  In addition to SOC 2 Type II, we align our practices with the OWASP
                  Top 10, CIS Benchmarks, and NIST Cybersecurity Framework. GDPR data
                  processing agreements are available for customers operating in the EU.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <CardTitle>Responsible Disclosure Program</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    We value the security research community and welcome responsible
                    disclosure of vulnerabilities. If you discover a security issue in
                    Bootnode, please report it to us privately so we can address it before
                    public disclosure.
                  </p>
                  <h4 className="font-semibold text-foreground">Scope</h4>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Bootnode API endpoints (api.bootnode.dev)</li>
                    <li>Bootnode dashboard (bootnode.dev/dashboard)</li>
                    <li>Bootnode documentation site (bootnode.dev/docs)</li>
                    <li>Authentication and authorization systems</li>
                    <li>Webhook delivery and signature verification</li>
                  </ul>
                  <h4 className="font-semibold text-foreground">Guidelines</h4>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Do not access or modify data belonging to other users</li>
                    <li>Do not perform denial-of-service attacks</li>
                    <li>Do not perform automated scanning at high volume</li>
                    <li>Provide sufficient detail for us to reproduce the issue</li>
                    <li>Allow reasonable time for remediation before public disclosure</li>
                  </ul>
                  <h4 className="font-semibold text-foreground">Reporting</h4>
                  <p>
                    Send vulnerability reports to{" "}
                    <a
                      href="mailto:security@bootnode.dev"
                      className="text-primary hover:underline"
                    >
                      security@bootnode.dev
                    </a>
                    . Include a detailed description, steps to reproduce, and any proof-of-concept
                    code. We will acknowledge receipt within 24 hours and provide an initial
                    assessment within 72 hours.
                  </p>
                  <p>
                    We do not currently offer monetary bounties but will credit researchers
                    in our security acknowledgments with their permission.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Questions about security?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Our team is happy to discuss our security practices, provide SOC 2 reports,
              or answer compliance questions.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/contact">
                  Contact Security Team
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
