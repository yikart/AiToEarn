/**
 * Grid - 栅格布局组件
 * 用于替代 antd 的 Row/Col
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 栅格间隔 */
  gutter?: number | [number, number]
  /** 子元素 */
  children?: React.ReactNode
}

function Row({ gutter = 0, className, children, style, ...props }: RowProps) {
  const [gutterX, gutterY] = Array.isArray(gutter) ? gutter : [gutter, gutter]

  return (
    <div
      className={cn('flex flex-wrap', className)}
      style={{
        marginLeft: gutterX ? `-${gutterX / 2}px` : undefined,
        marginRight: gutterX ? `-${gutterX / 2}px` : undefined,
        marginTop: gutterY ? `-${gutterY / 2}px` : undefined,
        marginBottom: gutterY ? `-${gutterY / 2}px` : undefined,
        ...style,
      }}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            style: {
              paddingLeft: gutterX ? `${gutterX / 2}px` : undefined,
              paddingRight: gutterX ? `${gutterX / 2}px` : undefined,
              paddingTop: gutterY ? `${gutterY / 2}px` : undefined,
              paddingBottom: gutterY ? `${gutterY / 2}px` : undefined,
              ...(child.props.style || {}),
            },
          } as any)
        }
        return child
      })}
    </div>
  )
}

interface ColProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 栅格占位格数，为 0 时不占位 */
  span?: number
  /** 子元素 */
  children?: React.ReactNode
}

function Col({ span = 24, className, children, style, ...props }: ColProps) {
  // 将 antd 的 24 栅格系统转换为百分比
  const widthPercent = (span / 24) * 100

  return (
    <div
      className={cn('flex-shrink-0', className)}
      style={{
        width: `${widthPercent}%`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export { Row, Col }

