'use client'

import type { CSSProperties } from 'react'
import { useId } from 'react'

import { APP_BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  animated?: boolean
  className?: string
  size?: number
  style?: CSSProperties
  variant?: 'app' | 'light' | 'mono'
}

export function BrandMark({
  animated = false,
  className,
  size = 32,
  style,
  variant = 'app',
}: BrandMarkProps) {
  const rawId = useId().replace(/:/g, '')
  const isMono = variant === 'mono'
  const isLight = variant === 'light'
  const showTile = variant !== 'light'

  return (
    <svg
      aria-label={APP_BRAND.name}
      role="img"
      className={cn(
        'inline-block shrink-0 overflow-visible align-middle drop-shadow-[0_10px_24px_rgba(37,99,235,0.14)]',
        className,
      )}
      fill="none"
      height={size}
      style={{ width: size, height: size, ...style }}
      viewBox="0 0 64 64"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${rawId}-blue`} x1="12" x2="45" y1="23" y2="46">
          <stop stopColor={isMono ? '#102033' : isLight ? '#ffffff' : '#2563eb'} />
          <stop offset="1" stopColor={isMono ? '#526071' : isLight ? '#dff7ff' : '#00a4ef'} />
        </linearGradient>
        <linearGradient id={`${rawId}-cyan`} x1="31" x2="51" y1="19" y2="44">
          <stop stopColor={isMono ? '#526071' : isLight ? '#ffffff' : '#00bbd9'} />
          <stop offset="1" stopColor={isMono ? '#102033' : isLight ? '#dff7ff' : '#5ad7e8'} />
        </linearGradient>
        <linearGradient id={`${rawId}-green`} x1="42" x2="57" y1="41" y2="30">
          <stop stopColor={isMono ? '#102033' : isLight ? '#ffffff' : '#22c55e'} />
          <stop offset="1" stopColor={isMono ? '#526071' : isLight ? '#dff7ff' : '#3fdd83'} />
        </linearGradient>
        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="68" id={`${rawId}-shadow`} width="68" x="-2" y="-2">
          <feDropShadow dx="0" dy="8" floodColor="#2563eb" floodOpacity="0.16" stdDeviation="8" />
        </filter>
      </defs>

      {showTile && (
        <rect
          fill="#fff"
          filter={`url(#${rawId}-shadow)`}
          height="54"
          rx="14"
          stroke={isMono ? '#d7dde7' : '#e7edf6'}
          width="54"
          x="5"
          y="5"
        />
      )}
      <g className={animated ? 'origin-center animate-pulse' : undefined}>
        <path
          d="M13.4 25.4c5.6.1 8.5 2.6 11 9.1 1.5 4 3.2 6 5.4 6.2 2.7.2 5.1-2.4 8.7-8.1l6.9-10.9c.8-1.2 2.6-.8 2.8.7l1.3 11.1c.2 1.6-1.8 2.6-2.9 1.4l-6.8-7.1"
          stroke={`url(#${rawId}-blue)`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="8.2"
        />
        <path
          d="M31.7 41.1c3.2-.9 5.4-3.9 8.5-8.7l5.1-8.1 8.2 10.1"
          stroke={`url(#${rawId}-cyan)`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="8.2"
        />
        <path
          d="M48.5 38.3 56 33.4"
          stroke={`url(#${rawId}-green)`}
          strokeLinecap="round"
          strokeWidth="3.2"
        />
        <circle cx="34.2" cy="17.4" fill={isMono ? '#102033' : isLight ? '#ffffff' : '#2563eb'} r="3.3" />
        <circle cx="56" cy="33.4" fill={isMono ? '#526071' : isLight ? '#ffffff' : '#22c55e'} r="3.1" />
        <circle cx="45.2" cy="24.1" fill={isMono ? '#102033' : '#fff'} opacity={isLight ? 0.75 : 0.5} r="1.5" />
      </g>
    </svg>
  )
}
