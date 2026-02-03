import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Book,
  Zap,
  Code,
  Wallet,
  Webhook,
  Shield,
  Radio,
  Blocks,
  Package,
  FileCode,
  Clock,
} from "lucide-react"

const sidebarNav = [
  { title: "Documentation", href: "/docs", icon: Book },
  { title: "Quickstart", href: "/docs/quickstart", icon: Zap },
  { title: "API Reference", href: "/docs/api", icon: Code },
  { title: "Authentication", href: "/docs/auth/quickstart", icon: Shield },
  { title: "Smart Wallets", href: "/docs/wallets/quickstart", icon: Wallet },
  { title: "Webhooks", href: "/docs/webhooks/quickstart", icon: Webhook },
  { title: "WebSockets", href: "/docs/websockets/quickstart", icon: Radio },
  { title: "Account Abstraction", href: "/docs/aa/quickstart", icon: Blocks },
  { title: "SDKs", href: "/docs/sdks", icon: Package },
  { title: "Examples", href: "/docs/examples", icon: FileCode },
  { title: "Changelog", href: "/docs/changelog", icon: Clock },
]

export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <nav className="sticky top-24 space-y-1">
              {sidebarNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
