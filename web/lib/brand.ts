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
    domain: "bootnode.dev",
    statusUrl: "https://status.bootnode.dev",
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
    name: "Hanzo",
    tagline: "Web3 Infrastructure",
    description: "Enterprise blockchain infrastructure powered by Hanzo AI. Multi-chain RPC, Token APIs, NFT APIs, Smart Wallets, and more.",
    logo: "/logo/hanzo-logo.svg",
    logoIcon: "/logo/hanzo-icon.svg",
    logoWhite: "/logo/hanzo-logo-white.svg",
    favicon: "/logo/hanzo-icon.svg",
    domain: "web3.hanzo.ai",
    statusUrl: "https://status.hanzo.ai",
    colors: {
      primary: "#0066ff",
      primaryForeground: "#ffffff",
    },
    social: {
      twitter: "https://twitter.com/hanaboratory",
      github: "https://github.com/hanzoai",
      discord: "https://discord.gg/hanzo",
    },
    iam: {
      url: "https://iam.hanzo.ai",
      clientId: "hanzo-web3",
      domain: "hanzo.id",
    },
  },
  lux: {
    name: "Lux Network",
    tagline: "Next-Gen Blockchain Infrastructure",
    description: "High-performance blockchain infrastructure for the Lux Network ecosystem.",
    logo: "/logo/lux-logo.svg",
    logoIcon: "/logo/lux-icon.svg",
    logoWhite: "/logo/lux-logo-white.svg",
    favicon: "/logo/lux-icon.svg",
    domain: "web3.lux.network",
    statusUrl: "https://status.lux.network",
    colors: {
      primary: "#8b5cf6",
      primaryForeground: "#ffffff",
    },
    social: {
      twitter: "https://twitter.com/luxdefi",
      github: "https://github.com/luxfi",
    },
    iam: {
      url: "https://iam.hanzo.ai",
      clientId: "lux-web3",
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

// Get brand from environment or default to bootnode
function getBrandKey(): string {
  // Check environment variable
  const envBrand = process.env.NEXT_PUBLIC_BRAND?.toLowerCase()
  if (envBrand && brands[envBrand]) {
    return envBrand
  }

  // Auto-detect from domain in browser
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    if (hostname.includes("hanzo.ai")) return "hanzo"
    if (hostname.includes("lux.network")) return "lux"
    if (hostname.includes("zoo.ngo")) return "zoo"
  }

  // Default to hanzo for production
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
