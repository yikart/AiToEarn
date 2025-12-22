/**
 * List - 列表组件
 * 用于显示列表数据
 */

'use client'

import { cn } from '@/lib/utils'

interface ListItemMetaProps {
  avatar?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
}

function ListItemMeta({ avatar, title, description }: ListItemMetaProps) {
  return (
    <div className="flex gap-3">
      {avatar && (
        <div className="shrink-0">
          {avatar}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-medium mb-1">{title}</div>
        )}
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
    </div>
  )
}

interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

function ListItem({ className, children, ...props }: ListItemProps) {
  return (
    <div
      className={cn('p-4 border rounded-lg mb-2 cursor-pointer transition-all', className)}
      {...props}
    >
      {children}
    </div>
  )
}

ListItem.Meta = ListItemMeta

interface ListProps<T = any> {
  dataSource?: T[]
  renderItem?: (item: T, index: number) => React.ReactNode
  className?: string
  children?: React.ReactNode
}

function List<T = any>({ dataSource, renderItem, className, children }: ListProps<T>) {
  if (children) {
    return <div className={cn('space-y-2', className)}>{children}</div>
  }

  if (!dataSource || !renderItem) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      {dataSource.map((item, index) => (
        <div key={index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}

List.Item = ListItem

export { List, ListItem, ListItemMeta }

