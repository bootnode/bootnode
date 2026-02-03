import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { Providers } from "@/app/providers"
import { Toaster } from "@/components/ui/sonner"
import "@/app/globals.css"

export const metadata: Metadata = {
  title: {
    default: "Bootnode - Blockchain Infrastructure for Developers",
    template: "%s | Bootnode",
  },
  description:
    "The complete blockchain development platform. Multi-chain RPC, Token APIs, NFT APIs, Smart Wallets, Webhooks, and more. Build faster with Bootnode.",
  keywords: [
    "blockchain",
    "RPC",
    "API",
    "Web3",
    "Ethereum",
    "Solana",
    "NFT",
    "DeFi",
    "smart contracts",
    "developer tools",
  ],
  authors: [{ name: "Bootnode" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bootnode.dev",
    siteName: "Bootnode",
    title: "Bootnode - Blockchain Infrastructure for Developers",
    description:
      "The complete blockchain development platform. Multi-chain RPC, Token APIs, NFT APIs, Smart Wallets, Webhooks, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bootnode - Blockchain Infrastructure for Developers",
    description:
      "The complete blockchain development platform. Multi-chain RPC, Token APIs, NFT APIs, Smart Wallets, Webhooks, and more.",
  },
  icons: {
    icon: "/logo/bootnode-icon.svg",
    apple: "/logo/bootnode-icon.svg",
    shortcut: "/logo/bootnode-icon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
