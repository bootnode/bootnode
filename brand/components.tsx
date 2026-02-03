// Bootnode Logo Components
// React components for consistent logo usage across the platform

import { bootnode } from './config'

interface LogoProps {
  variant?: 'main' | 'white' | 'mono' | 'icon'
  size?: number | string
  className?: string
}

export function BootnodeLogo({ 
  variant = 'main', 
  size = 32, 
  className = '' 
}: LogoProps) {
  const logoPath = bootnode.logo[variant]
  
  return (
    <img 
      src={logoPath}
      alt="Bootnode"
      width={size}
      height={size}
      className={className}
    />
  )
}

export function BootnodeIcon({ 
  size = 24, 
  className = '' 
}: Omit<LogoProps, 'variant'>) {
  return (
    <BootnodeLogo 
      variant="icon" 
      size={size} 
      className={className} 
    />
  )
}

// Logo with text for headers
export function BootnodeBrand({ 
  variant = 'main',
  showTagline = false,
  className = ''
}: LogoProps & { showTagline?: boolean }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <BootnodeLogo variant={variant} size={32} />
      <div>
        <h1 className="text-xl font-bold text-bootnode-text">
          {bootnode.name}
        </h1>
        {showTagline && (
          <p className="text-sm text-bootnode-muted">
            {bootnode.tagline}
          </p>
        )}
      </div>
    </div>
  )
}

// Organization badge component
export function OrgBadge({ org }: { org: keyof typeof bootnode.orgs }) {
  const orgConfig = bootnode.orgs[org]
  
  return (
    <span 
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: orgConfig.color }}
    >
      {orgConfig.name}
    </span>
  )
}

export default {
  BootnodeLogo,
  BootnodeIcon,
  BootnodeBrand,
  OrgBadge,
}