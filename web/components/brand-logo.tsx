"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Blocks } from "lucide-react"

// Brand configuration - reads from environment
export function useBrand() {
  const [brand, setBrand] = useState<BrandConfig>(brands.bootnode)

  useEffect(() => {
    // Check environment variable first
    const envBrand = process.env.NEXT_PUBLIC_BRAND?.toLowerCase()
    if (envBrand && brands[envBrand as keyof typeof brands]) {
      setBrand(brands[envBrand as keyof typeof brands])
      return
    }

    // Auto-detect from hostname
    const hostname = window.location.hostname
    if (hostname.includes("hanzo.ai") || hostname.includes("web3.hanzo")) {
      setBrand(brands.hanzo)
    } else if (hostname.includes("lux.network")) {
      setBrand(brands.lux)
    } else if (hostname.includes("zoo.ngo")) {
      setBrand(brands.zoo)
    }
  }, [])

  return brand
}

type BrandConfig = {
  name: string
  tagline: string
  logo: string
  logoDark: string // For light mode (dark logo)
  logoIcon: string
  favicon: string
  primaryColor: string
  iam: {
    url: string
    clientId: string
    domain: string
  }
}

const brands = {
  bootnode: {
    name: "Bootnode",
    tagline: "Blockchain Infrastructure for Developers",
    logo: "/logo/bootnode-logo.svg",
    logoDark: "/logo/bootnode-logo.svg",
    logoIcon: "/logo/bootnode-icon.svg",
    favicon: "/logo/bootnode-icon.svg",
    primaryColor: "#000000",
    iam: {
      url: process.env.NEXT_PUBLIC_IAM_URL || "https://iam.hanzo.ai",
      clientId: process.env.NEXT_PUBLIC_IAM_CLIENT_ID || "bootnode-platform",
      domain: "hanzo.id",
    },
  },
  hanzo: {
    name: "Hanzo",
    tagline: "Web3 Infrastructure",
    logo: "/logo/hanzo-logo.svg", // White logo for dark mode
    logoDark: "/logo/hanzo-logo-dark.svg", // Black logo for light mode
    logoIcon: "/logo/hanzo-icon.svg",
    favicon: "/logo/hanzo-icon.svg",
    primaryColor: "#000000",
    iam: {
      url: "https://iam.hanzo.ai",
      clientId: "hanzo-web3",
      domain: "hanzo.id",
    },
  },
  lux: {
    name: "Lux Network",
    tagline: "Next-Gen Blockchain",
    logo: "/logo/lux-logo.svg",
    logoDark: "/logo/lux-logo.svg",
    logoIcon: "/logo/lux-icon.svg",
    favicon: "/logo/lux-icon.svg",
    primaryColor: "#8b5cf6",
    iam: {
      url: "https://iam.hanzo.ai",
      clientId: "lux-web3",
      domain: "lux.id",
    },
  },
  zoo: {
    name: "Zoo Labs",
    tagline: "Decentralized AI",
    logo: "/logo/zoo-logo.svg",
    logoDark: "/logo/zoo-logo.svg",
    logoIcon: "/logo/zoo-icon.svg",
    favicon: "/logo/zoo-icon.svg",
    primaryColor: "#00cc66",
    iam: {
      url: "https://iam.hanzo.ai",
      clientId: "zoo-web3",
      domain: "zoo.id",
    },
  },
} as const

// Brand Logo Component
export function BrandLogo({
  showText = true,
  size = "default",
  className = ""
}: {
  showText?: boolean
  size?: "small" | "default" | "large"
  className?: string
}) {
  const brand = useBrand()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sizeClasses = {
    small: "h-5 w-5",
    default: "h-6 w-6",
    large: "h-8 w-8",
  }

  const textSizes = {
    small: "text-lg",
    default: "text-xl",
    large: "text-2xl",
  }

  const pixelSizes = {
    small: 20,
    default: 24,
    large: 32,
  }

  // Use dark logo for light mode, white logo for dark mode
  const logoSrc = mounted && resolvedTheme === "dark" ? brand.logo : brand.logoDark

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {brand.name === "Bootnode" ? (
        <Blocks className={sizeClasses[size]} />
      ) : (
        <Image
          src={logoSrc}
          alt={brand.name}
          width={pixelSizes[size]}
          height={pixelSizes[size]}
          className={sizeClasses[size]}
        />
      )}
      {showText && (
        <span className={`font-bold ${textSizes[size]}`}>{brand.name}</span>
      )}
    </div>
  )
}

// Export brand info for use in metadata, etc.
export function getBrandName(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_BRAND === "hanzo" ? "Hanzo" : "Bootnode"
  }
  const hostname = window.location.hostname
  if (hostname.includes("hanzo.ai")) return "Hanzo"
  if (hostname.includes("lux.network")) return "Lux Network"
  if (hostname.includes("zoo.ngo")) return "Zoo Labs"
  return "Bootnode"
}
