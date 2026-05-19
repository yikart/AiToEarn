/**
 * Pagination - 分页组件
 * 用于显示分页导航
 * 支持两种使用方式：
 * 1. 简化版：直接使用 Pagination 组件
 * 2. 组合版：使用 PaginationContent, PaginationItem 等子组件
 */

'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import * as React from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from './button'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

// ==================== 组合式分页组件 ====================

function PaginationRoot({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}
PaginationRoot.displayName = 'Pagination'

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
))
PaginationContent.displayName = 'PaginationContent'

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
))
PaginationItem.displayName = 'PaginationItem'

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, 'size'>
& React.ComponentProps<'a'>

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size,
        }),
        'h-8 w-8',
        isActive && 'border-primary bg-primary/10',
        className,
      )}
      {...props}
    />
  )
}
PaginationLink.displayName = 'PaginationLink'

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn('gap-1 pl-2.5 w-auto', className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden sm:inline">上一页</span>
    </PaginationLink>
  )
}
PaginationPrevious.displayName = 'PaginationPrevious'

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn('gap-1 pr-2.5 w-auto', className)}
      {...props}
    >
      <span className="hidden sm:inline">下一页</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  )
}
PaginationNext.displayName = 'PaginationNext'

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}
PaginationEllipsis.displayName = 'PaginationEllipsis'

// ==================== 简化版分页组件 ====================

const PAGE_LABEL_COMPACT_THRESHOLD = 10000

function formatPageLabel(page: number) {
  if (page < PAGE_LABEL_COMPACT_THRESHOLD) {
    return String(page)
  }

  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(page)
}

interface PaginationProps {
  /** 当前页码 */
  current?: number
  /** 每页条数 */
  pageSize?: number
  /** 总条数 */
  total?: number
  /** 页码改变回调 */
  onChange?: (page: number, pageSize?: number) => void
  /** 每页条数改变回调 */
  onShowSizeChange?: (current: number, size: number) => void
  /** 是否显示每页条数选择器 */
  showSizeChanger?: boolean
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean
  /** 显示总数 */
  showTotal?: (total: number, range: [number, number]) => React.ReactNode
  /** 每页条数选项 */
  pageSizeOptions?: string[]
  /** 自定义类名 */
  className?: string
  /** 子元素（用于组合式） */
  children?: React.ReactNode
}

function Pagination({
  current = 1,
  pageSize = 10,
  total = 0,
  onChange,
  onShowSizeChange,
  showSizeChanger = false,
  showQuickJumper = false,
  showTotal,
  pageSizeOptions = ['10', '20', '50', '100'],
  className,
  children,
}: PaginationProps) {
  const { t } = useTransClient('common')

  // 如果有 children，使用组合式渲染
  if (children) {
    return (
      <PaginationRoot className={className}>
        {children}
      </PaginationRoot>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, total)
  const showPageControls = totalPages > 1

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onChange?.(page, pageSize)
    }
  }

  const handleSizeChange = (size: number) => {
    onShowSizeChange?.(current, size)
    onChange?.(1, size)
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    }
    else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
      else if (current >= totalPages - 2) {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      }
      else {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (total === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2 text-sm', className)}>
      {/* 显示总数 */}
      {showTotal && (
        <div className="whitespace-nowrap rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {showTotal(total, [start, end])}
        </div>
      )}

      {/* 分页按钮组 */}
      {showPageControls && (
        <div className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-card/95 p-1 shadow-sm shadow-primary/5">
          {/* 上一页 */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg"
            onClick={() => handlePageChange(current - 1)}
            disabled={current === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>

          {/* 页码 */}
          {getPageNumbers().map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-7 items-center justify-center px-1.5 text-xs text-muted-foreground"
                >
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const pageLabel = formatPageLabel(pageNum)

            return (
              <Button
                key={pageNum}
                variant={current === pageNum ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-auto min-w-7 max-w-14 rounded-lg px-2 text-xs tabular-nums"
                title={String(pageNum)}
                onClick={() => handlePageChange(pageNum)}
              >
                <span className="truncate">{pageLabel}</span>
              </Button>
            )
          })}

          {/* 下一页 */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg"
            onClick={() => handlePageChange(current + 1)}
            disabled={current === totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* 每页条数选择器 */}
      {showSizeChanger && (
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border/70 bg-card/95 px-2 py-1 text-xs text-muted-foreground shadow-sm shadow-primary/5">
          <span>{t('pagination.perPage')}</span>
          <Select value={String(pageSize)} onValueChange={value => handleSizeChange(Number(value))}>
            <SelectTrigger className="h-7 w-16 rounded-lg px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {pageSizeOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>{t('pagination.items')}</span>
        </div>
      )}

      {/* 快速跳转 */}
      {showQuickJumper && (
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-border/70 bg-card/95 px-2 py-1 text-xs text-muted-foreground shadow-sm shadow-primary/5">
          <span className="text-muted-foreground">{t('pagination.jumpTo')}</span>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="h-7 w-14 rounded-lg px-2 text-center text-xs"
            placeholder={t('pagination.page')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const page = Number((e.target as HTMLInputElement).value)
                handlePageChange(page)
                ;(e.target as HTMLInputElement).value = ''
              }
            }}
          />
          <span className="text-muted-foreground">{t('pagination.page')}</span>
        </div>
      )}
    </div>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}

export type { PaginationProps }
