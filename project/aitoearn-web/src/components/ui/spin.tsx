/**
 * Spin - 加载中组件
 * 用于显示加载状态
 */

'use client'

import { cn } from '@/lib/utils'

interface SpinProps {
  /** 是否显示加载状态 */
  spinning?: boolean
  /** 子元素 */
  children?: React.ReactNode
  /** 自定义类名 */
  className?: string
  /** 提示文字 */
  tip?: string
}

export function Spin({ spinning = false, children, className, tip }: SpinProps) {
  if (!spinning && !children) {
    return null
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-2">
      <svg
        className="animate-spin h-5 w-5 text-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {tip && <span className="text-sm text-muted-foreground">{tip}</span>}
    </div>
  )

  if (!children) {
    return <div className={cn('flex items-center justify-center p-4', className)}>{spinner}</div>
  }

  return (
    <div className={cn('relative', className)}>
      {spinning && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded">
          {spinner}
        </div>
      )}
      {children}
    </div>
  )
}
