'use client'

import { BrandMark } from '@/components/Brand/BrandMark'
import { APP_BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

interface BrandWordmarkProps {
  className?: string
  collapsed?: boolean
  direction?: 'row' | 'stack'
  markSize?: number
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'app' | 'light' | 'mono'
}

const textSizeMap = {
  sm: {
    name: 'text-sm',
    tagline: 'text-[10px]',
  },
  md: {
    name: 'text-base',
    tagline: 'text-[11px]',
  },
  lg: {
    name: 'text-lg md:text-xl',
    tagline: 'text-xs',
  },
}

export function BrandWordmark({
  className,
  collapsed = false,
  direction = 'row',
  markSize = 32,
  showTagline = false,
  size = 'md',
  variant = 'app',
}: BrandWordmarkProps) {
  const textTone = variant === 'light' ? 'text-white' : 'text-foreground'
  const mutedTone = variant === 'light' ? 'text-white/62' : 'text-muted-foreground'
  const sizes = textSizeMap[size]

  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center',
        direction === 'stack' ? 'flex-col gap-3 text-center' : 'gap-2.5',
        className,
      )}
    >
      <BrandMark animated={showTagline} size={markSize} variant={variant} />
      {!collapsed && (
        <span className={cn('flex min-w-0 flex-col', direction === 'stack' && 'items-center')}>
          <span className={cn('truncate font-semibold leading-none tracking-tight', sizes.name, textTone)}>
            {APP_BRAND.name}
          </span>
          {showTagline && (
            <span className={cn('mt-1 truncate font-medium leading-none tracking-[0.18em]', sizes.tagline, mutedTone)}>
              {APP_BRAND.tagline}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
