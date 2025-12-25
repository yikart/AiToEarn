/**
 * Steps - 步骤条组件
 * 用于显示步骤进度
 */

'use client'

import { cn } from '@/lib/utils'
import { Check, Loader2, X } from 'lucide-react'

export type StepStatus = 'wait' | 'process' | 'finish' | 'error'

export interface StepItem {
  title: React.ReactNode
  description?: React.ReactNode
  status?: StepStatus
}

interface StepsProps {
  /** 当前步骤索引 */
  current?: number
  /** 步骤项数组 */
  items: StepItem[]
  /** 方向，vertical 或 horizontal */
  direction?: 'vertical' | 'horizontal'
  /** 自定义类名 */
  className?: string
}

export function Steps({ current = 0, items, direction = 'horizontal', className }: StepsProps) {
  const isVertical = direction === 'vertical'

  const getStepStatus = (index: number, itemStatus?: StepStatus): StepStatus => {
    if (itemStatus) return itemStatus
    if (index < current) return 'finish'
    if (index === current) return 'process'
    return 'wait'
  }

  const getStepIcon = (index: number, status: StepStatus) => {
    if (status === 'finish') {
      return <Check className="w-5 h-5 text-white" />
    }
    if (status === 'process') {
      return <Loader2 className="w-5 h-5 text-white animate-spin" />
    }
    if (status === 'error') {
      return <X className="w-5 h-5 text-white" />
    }
    return <span className="text-sm font-medium">{index + 1}</span>
  }

  const getStepClassName = (status: StepStatus) => {
    const base = 'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors'
    switch (status) {
      case 'finish':
        return cn(base, 'bg-primary border-primary text-white')
      case 'process':
        return cn(base, 'bg-primary border-primary text-white')
      case 'error':
        return cn(base, 'bg-destructive border-destructive text-white')
      default:
        return cn(base, 'bg-background border-muted-foreground/30 text-muted-foreground')
    }
  }

  if (isVertical) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        {items.map((item, index) => {
          const status = getStepStatus(index, item.status)
          const isLast = index === items.length - 1

          return (
            <div key={index} className="flex gap-4">
              {/* 步骤图标和连接线 */}
              <div className="flex flex-col items-center">
                <div className={getStepClassName(status)}>
                  {getStepIcon(index, status)}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 mt-2',
                      status === 'finish' || status === 'process' ? 'bg-primary' : 'bg-muted-foreground/30',
                    )}
                  />
                )}
              </div>

              {/* 步骤内容 */}
              <div className="flex-1 pb-4">
                <div
                  className={cn(
                    'font-medium mb-1',
                    status === 'process' ? 'text-primary' : status === 'error' ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {item.title}
                </div>
                {item.description && (
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Horizontal layout
  return (
    <div className={cn('flex items-center', className)}>
      {items.map((item, index) => {
        const status = getStepStatus(index, item.status)
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              {/* 步骤图标 */}
              <div className={getStepClassName(status)}>
                {getStepIcon(index, status)}
              </div>

              {/* 步骤内容 */}
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    'font-medium text-sm',
                    status === 'process' ? 'text-primary' : status === 'error' ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {item.title}
                </div>
                {item.description && (
                  <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                )}
              </div>
            </div>

            {/* 连接线 */}
            {!isLast && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2',
                  status === 'finish' || status === 'process' ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

