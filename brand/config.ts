// Bootnode Brand Configuration
// Following Hanzo ecosystem standards

export const bootnode = {
  name: 'Bootnode',
  tagline: 'Blockchain Infrastructure for Developers',
  description: 'The complete blockchain development platform. Multi-chain RPC, Token APIs, NFT APIs, Smart Wallets, Webhooks, and more.',
  
  // Colors aligned with logo
  colors: {
    primary: '#372929',      // From logo background
    secondary: '#ffffff',    // From logo gradient
    accent: '#d8d8d8',      // From logo gradient
    surface: '#f5f5f5',     // Light surface
    text: '#1a1a1a',        // Dark text
    textMuted: '#6b7280',   // Muted text
  },
  
  // Typography
  typography: {
    fontFamily: 'Geist Sans, system-ui, sans-serif',
    monoFamily: 'Geist Mono, Consolas, monospace',
  },
  
  // Logo variants
  logo: {
    main: '/logo/bootnode-logo.svg',
    white: '/logo/bootnode-logo-white.svg',
    mono: '/logo/bootnode-logo-mono.svg',
    icon: '/logo/bootnode-icon.svg',
  },
  
  // URLs & Links
  urls: {
    app: 'https://bootnode.dev',
    admin: 'https://admin.bootnode.dev',
    docs: 'https://docs.bootnode.dev',
    api: 'https://api.bootnode.dev',
    github: 'https://github.com/bootnode',
  },
  
  // Organizations
  orgs: {
    hanzo: {
      name: 'Hanzo',
      domain: 'hanzo.id',
      color: '#0066ff',
    },
    zoo: {
      name: 'Zoo Labs', 
      domain: 'zoo.id',
      color: '#00cc66',
    },
    lux: {
      name: 'Lux Network',
      domain: 'lux.id', 
      color: '#8b5cf6',
    },
    pars: {
      name: 'Pars',
      domain: 'pars.id',
      color: '#f59e0b',
    },
  },
  
  // Supported networks
  networks: [
    'Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 
    'Base', 'Avalanche', 'BNB Chain', 'Lux', 
    'Bitcoin', 'Solana'
  ],
  
  // Platform features
  features: [
    'Multi-chain RPC Proxy',
    'Token & NFT APIs', 
    'Smart Wallets (ERC-4337)',
    'Gas Management',
    'Webhook System',
    'Real-time Analytics',
    'Developer Dashboard',
    'Admin Management',
  ],
  
  // Social media
  social: {
    twitter: '@bootnode_dev',
    discord: 'https://discord.gg/bootnode',
    telegram: 'https://t.me/bootnode',
  },
}

export default bootnode