/**
 * Pagination - 分页组件
 * 用于显示分页导航
 */

'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import { Button } from './button'

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
}

export function Pagination({
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
}: PaginationProps) {
  const { t } = useTransClient('common')
  const totalPages = Math.ceil(total / pageSize)
  const start = (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, total)

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
    <div className={cn('flex flex-wrap items-center justify-center gap-3', className)}>
      {/* 显示总数 */}
      {showTotal && (
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {showTotal(total, [start, end])}
        </div>
      )}

      {/* 分页按钮组 */}
      <div className="flex items-center gap-1">
        {/* 上一页 */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 页码 */}
        {getPageNumbers().map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 h-8 flex items-center justify-center text-muted-foreground"
              >
                ...
              </span>
            )
          }

          const pageNum = page as number
          return (
            <Button
              key={pageNum}
              variant={current === pageNum ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </Button>
          )
        })}

        {/* 下一页 */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 每页条数选择器 */}
      {showSizeChanger && (
        <div className="flex items-center gap-2 text-sm whitespace-nowrap">
          <span className="text-muted-foreground">{t('pagination.perPage')}</span>
          <select
            value={pageSize}
            onChange={e => handleSizeChange(Number(e.target.value))}
            className="h-8 px-2 py-1 text-sm border border-input rounded-md bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground">{t('pagination.items')}</span>
        </div>
      )}

      {/* 快速跳转 */}
      {showQuickJumper && (
        <div className="flex items-center gap-2 text-sm whitespace-nowrap">
          <span className="text-muted-foreground">{t('pagination.jumpTo')}</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            className="h-8 w-14 px-2 text-sm text-center border border-input rounded-md bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
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
