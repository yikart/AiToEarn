/**
 * Card - 卡片组件
 * 用于显示卡片内容
 */

'use client'

import { cn } from '@/lib/utils'

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 标题 */
  title?: React.ReactNode
  /** 额外内容 */
  extra?: React.ReactNode
}

export function Card({ className, title, extra, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    >
      {(title || extra) && (
        <div className="flex items-center justify-between p-6 pb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div className={cn('p-6', !title && !extra && 'p-6')}>
        {children}
      </div>
    </div>
  )
}

