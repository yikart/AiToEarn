/**
 * Card - 卡片组件
 * 支持两种 API：
 * 1. 简化 API：<Card title="标题" extra={<Button />}>内容</Card>
 * 2. shadcn/ui 标准 API：<Card><CardHeader><CardTitle>标题</CardTitle></CardHeader><CardContent>内容</CardContent></Card>
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ==================== shadcn/ui 标准子组件 ====================

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className,
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

// ==================== 简化 API 组件（兼容旧代码） ====================

interface SimpleCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 标题 */
  title?: React.ReactNode
  /** 额外内容 */
  extra?: React.ReactNode
}

function SimpleCard({ className, title, extra, children, ...props }: SimpleCardProps) {
  return (
    <div
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    >
      {(title || extra) && (
        <div className="flex items-center justify-between p-6 pb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div className={cn('p-6', !title && !extra && 'p-6')}>{children}</div>
    </div>
  )
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, SimpleCard }
