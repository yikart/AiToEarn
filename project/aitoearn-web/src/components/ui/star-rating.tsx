/**
 * StarRating - 星星评分组件
 * 功能：支持悬停预览、点击选择评分，可配置尺寸和交互模式
 */

'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/** 尺寸映射 */
const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export interface StarRatingProps {
  /** 当前评分值 */
  value?: number | null
  /** 评分变化回调 */
  onChange?: (value: number) => void
  /** 星星总数，默认 5 */
  count?: number
  /** 星星尺寸，默认 'md' */
  size?: 'sm' | 'md' | 'lg'
  /** 是否禁用交互 */
  disabled?: boolean
  /** 是否只读（仅展示，无悬停效果） */
  readOnly?: boolean
  /** 自定义类名 */
  className?: string
}

export function StarRating({
  value = null,
  onChange,
  count = 5,
  size = 'md',
  disabled = false,
  readOnly = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  // 显示的评分：悬停时用 hoverValue，否则用实际 value
  const displayValue = hoverValue ?? value
  // 是否可交互
  const isInteractive = !disabled && !readOnly && !!onChange

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      onMouseLeave={() => isInteractive && setHoverValue(null)}
    >
      {Array.from({ length: count }).map((_, idx) => {
        const starValue = idx + 1
        const isActive = displayValue !== null && displayValue >= starValue

        return (
          <button
            key={starValue}
            type="button"
            disabled={disabled}
            onClick={() => isInteractive && onChange?.(starValue)}
            onMouseEnter={() => isInteractive && setHoverValue(starValue)}
            className={cn(
              'p-1 rounded transition-colors',
              isInteractive && 'cursor-pointer hover:bg-muted',
              isActive ? 'text-amber-400' : 'text-muted-foreground',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            aria-label={`${starValue} star`}
          >
            <Star className={sizeMap[size]} fill={isActive ? 'currentColor' : 'none'} />
          </button>
        )
      })}
    </div>
  )
}

export default StarRating
