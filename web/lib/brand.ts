// White-label branding configuration
// Configure via environment variables for different deployments

export type BrandConfig = {
  name: string
  tagline: string
  description: string
  logo: string
  logoIcon: string
  logoWhite: string
  favicon: string
  domain: string
  statusUrl: string
  colors: {
    primary: string
    primaryForeground: string
  }
  social: {
    twitter?: string
    github?: string
    discord?: string
  }
  iam: {
    url: string
    clientId: string
    domain: string // e.g., hanzo.id, zoo.id
  }
}

// Brand presets
const brands: Record<string, BrandConfig> = {
  bootnode: {
    name: "Bootnode",
    tagline: "Blockchain Infrastructure for Developers",
    description: "The complete blockchain development platform. Multi-chain RPC, Token APIs, NFT APIs, Smart Wallets, Webhooks, and more.",
    logo: "/logo/bootnode-logo.svg",
    logoIcon: "/logo/bootnode-icon.svg",
    logoWhite: "/logo/bootnode-logo-white.svg",
    favicon: "/logo/bootnode-icon.svg",
    domain: "bootno.de",
    statusUrl: "https://status.bootno.de",
    colors: {
      primary: "#000000",
      primaryForeground: "#ffffff",
    },
    social: {
      twitter: "https://twitter.com/bootnode",
      github: "https://github.com/bootnode",
    },
    iam: {
      url: "https://iam.hanzo.ai",
      clientId: "bootnode-platform",
      domain: "hanzo.id",
    },
  },
  hanzo: {
    name: "Hanzo Web3",
    tagline: "Enterprise Blockchain Infrastructure",
    description: "Enterprise blockchain infrastructure powered by Hanzo AI. Multi-chain RPC, Token APIs, NFT APIs, Smart Wallets, and more.",
    logo: "/logo/hanzo-logo.svg",
    logoIcon: "/logo/hanzo-icon.svg",
    logoWhite: "/logo/hanzo-logo-white.svg",
    favicon: "/logo/hanzo-icon.svg",
    domain: "web3.hanzo.ai",
    statusUrl: "https://status.hanzo.ai",
    colors: {
      primary: "#000000",
      primaryForeground: "#ffffff",
    },
    social: {
      twitter: "https://twitter.com/hanaboratory",
      github: "https://github.com/hanzoai",
      discord: "https://discord.gg/hanzo",
    },
    iam: {
      url: "https://hanzo.id",
      clientId: "hanzo-web3",
      domain: "hanzo.id",
    },
  },
  lux: {
    name: "Lux Cloud",
    tagline: "Next-Gen Blockchain Infrastructure",
    description: "High-performance blockchain infrastructure for the Lux Network ecosystem.",
    logo: "/logo/lux-logo.svg",
    logoIcon: "/logo/lux-icon.svg",
    logoWhite: "/logo/lux-logo-white.svg",
    favicon: "/logo/lux-icon.svg",
    domain: "lux.cloud",
    statusUrl: "https://status.lux.cloud",
    colors: {
      primary: "#8b5cf6",
      primaryForeground: "#ffffff",
    },
    social: {
      twitter: "https://twitter.com/luxdefi",
      github: "https://github.com/luxfi",
    },
    iam: {
      url: "https://lux.id",
      clientId: "lux-cloud",
      domain: "lux.id",
    },
  },
  zoo: {
    name: "Zoo Labs",
    tagline: "Decentralized AI Infrastructure",
    description: "Blockchain infrastructure for decentralized AI and science research.",
    logo: "/logo/zoo-logo.svg",
    logoIcon: "/logo/zoo-icon.svg",
    logoWhite: "/logo/zoo-logo-white.svg",
    favicon: "/logo/zoo-icon.svg",
    domain: "web3.zoo.ngo",
    statusUrl: "https://status.zoo.ngo",
    colors: {
      primary: "#00cc66",
      primaryForeground: "#ffffff",
    },
    social: {
      twitter: "https://twitter.com/zoolabs",
      github: "https://github.com/zoolabs",
    },
    iam: {
      url: "https://iam.hanzo.ai",
      clientId: "zoo-web3",
      domain: "zoo.id",
    },
  },
}

// Get brand from environment or auto-detect from domain
function getBrandKey(): string {
  // Check environment variable first (highest priority)
  const envBrand = process.env.NEXT_PUBLIC_BRAND?.toLowerCase()
  if (envBrand && brands[envBrand]) {
    return envBrand
  }

  // Auto-detect from domain in browser
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    // Lux Cloud branding
    if (hostname.includes("lux.cloud") || hostname.includes("lux.network")) return "lux"
    // Zoo branding
    if (hostname.includes("zoo.ngo") || hostname.includes("zoo.id")) return "zoo"
    // Bootnode standalone (if ever deployed separately)
    if (hostname.includes("bootno.de") || hostname.includes("bootnode.io")) return "bootnode"
    // Default: Hanzo branding (web3.hanzo.ai, localhost, etc.)
  }

  // Default to Hanzo Web3 branding
  return "hanzo"
}

// Export the active brand configuration
export function getBrand(): BrandConfig {
  return brands[getBrandKey()]
}

// Export brand key for conditional rendering
export function getBrandKey_(): string {
  return getBrandKey()
}

// Check if using Hanzo branding
export function isHanzoBrand(): boolean {
  return getBrandKey() === "hanzo"
}

// Get all available brands (for admin/testing)
export function getAllBrands(): Record<string, BrandConfig> {
  return brands
}

// Default export for convenience
export const brand = getBrand()
