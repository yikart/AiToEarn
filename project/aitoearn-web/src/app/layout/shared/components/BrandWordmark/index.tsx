/**
 * BrandWordmark - 布局区域复用的品牌字标
 */

import { cn } from '@/lib/utils'

export const BRAND_TITLE = 'AitoEarn'

type BrandWordmarkTag = 'h1' | 'span'
type BrandWordmarkSize = 'sidebar' | 'mobile'

export interface BrandWordmarkProps {
  as?: BrandWordmarkTag
  size?: BrandWordmarkSize
  className?: string
}

const WORDMARK_SIZE_CLASSNAME: Record<BrandWordmarkSize, string> = {
  sidebar: 'text-[1.05rem] tracking-[-0.045em]',
  mobile: 'text-base tracking-[-0.04em]',
}

const ANCHOR_SIZE_CLASSNAME: Record<BrandWordmarkSize, string> = {
  sidebar: 'text-[1.1em]',
  mobile: 'text-[1.08em]',
}

export function BrandWordmark({
  as = 'span',
  size = 'sidebar',
  className,
}: BrandWordmarkProps) {
  const Component = as

  return (
    <Component
      className={cn(
        'm-0 flex select-none items-baseline whitespace-nowrap font-semibold leading-none',
        WORDMARK_SIZE_CLASSNAME[size],
        className,
      )}
      aria-label={BRAND_TITLE}
    >
      <span
        className={cn(
          'inline-block font-bold text-foreground transition-transform duration-300 group-hover/logo:-translate-y-px',
          ANCHOR_SIZE_CLASSNAME[size],
        )}
      >
        A
      </span>
      <span className="text-foreground/90">ito</span>
      <span
        className={cn(
          'inline-flex items-baseline bg-gradient-back bg-clip-text text-transparent transition-transform duration-300 group-hover/logo:translate-x-px',
        )}
      >
        <span className={cn('inline-block font-bold', ANCHOR_SIZE_CLASSNAME[size])}>E</span>
        <span>arn</span>
      </span>
    </Component>
  )
}
