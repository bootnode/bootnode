import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Modern React & Next.js features
  reactStrictMode: true,
  
  // Production-ready output
  output: "standalone",
  devIndicators: false,
  
  // Turbopack configuration (required for Next.js 16)
  turbopack: {},
  
  // Security and cache headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            // Prevent aggressive edge caching for HTML pages
            key: 'CDN-Cache-Control',
            value: 'max-age=60'
          }
        ]
      },
      {
        // Static assets can be cached longer
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  
  // Environment variables
  env: {
    CUSTOM_PORT: '3001'
  },
  
  // Image optimization for modern formats
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ['image/avif', 'image/webp']
  },
  
  // Redirects from legacy admin paths
  async redirects() {
    return [
      {
        source: '/admin/:path*',
        destination: '/dashboard/:path*',
        permanent: true,
      },
    ]
  }
}

export default nextConfig
