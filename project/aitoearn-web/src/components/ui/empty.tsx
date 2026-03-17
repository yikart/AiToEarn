/**
 * Empty - 空状态组件
 * 用于显示空数据状态
 */

'use client'

import { cn } from '@/lib/utils'

interface EmptyProps {
  /** 描述文字 */
  description?: React.ReactNode
  /** 自定义图标 */
  image?: React.ReactNode
  /** 自定义类名 */
  className?: string
}

export function Empty({ description = '暂无数据', image, className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {image || <div className="text-6xl mb-4 opacity-30">📭</div>}
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
  )
}
