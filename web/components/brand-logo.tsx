"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { getBrand, type BrandConfig } from "@/lib/brand"

// Hook to get brand configuration with client-side detection
export function useBrand() {
  const [brand, setBrand] = useState<BrandConfig>(getBrand())

  useEffect(() => {
    // Re-check brand on client side (for domain detection)
    setBrand(getBrand())
  }, [])

  return brand
}

// Brand Logo Component - theme-aware and white-label ready
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

  // Use white logo for dark mode, default logo for light mode
  const logoSrc = mounted && resolvedTheme === "dark" ? brand.logoWhite : brand.logo

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Image
        src={brand.logoIcon}
        alt={brand.name}
        width={pixelSizes[size]}
        height={pixelSizes[size]}
        className={sizeClasses[size]}
      />
      {showText && (
        <span className={`font-bold ${textSizes[size]}`}>{brand.name}</span>
      )}
    </div>
  )
}

// Full logo (icon + text as image if available)
export function BrandLogoFull({
  size = "default",
  className = ""
}: {
  size?: "small" | "default" | "large"
  className?: string
}) {
  const brand = useBrand()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const heights = {
    small: 24,
    default: 32,
    large: 40,
  }

  // Use white logo for dark mode
  const logoSrc = mounted && resolvedTheme === "dark" ? brand.logoWhite : brand.logo

  return (
    <Image
      src={logoSrc}
      alt={brand.name}
      width={heights[size] * 4}
      height={heights[size]}
      className={className}
    />
  )
}

// Export brand name helper for SSR-safe usage
export function getBrandName(): string {
  return getBrand().name
}

// Export brand tagline
export function getBrandTagline(): string {
  return getBrand().tagline
}
