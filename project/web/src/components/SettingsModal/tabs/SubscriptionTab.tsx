/**
 * SubscriptionTab - 订阅 Tab
 * 显示用户余额和使用记录
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  centsToUsd,
  formatAmountChange,
  getCreditsBalanceApi,
  getCreditsRecordsApi,
  type CreditsRecordVo,
} from '@/api/credits'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'

/** 每页显示的记录数 */
const PAGE_SIZE = 10

export function SubscriptionTab() {
  const { t } = useTransClient('settings')

  // 从 user store 读取余额状态
  const { creditsBalance, creditsLoading, setCreditsBalance } = useUserStore(
    useShallow(state => ({
      creditsBalance: state.creditsBalance,
      creditsLoading: state.creditsLoading,
      setCreditsBalance: state.setCreditsBalance,
    })),
  )

  // 本地余额加载状态（用于初次加载）
  const [balanceLoading, setBalanceLoading] = useState(true)

  // 记录列表状态
  const [records, setRecords] = useState<CreditsRecordVo[]>([])
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // 获取余额并同步到 store
  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true)
    try {
      const res = await getCreditsBalanceApi()
      if (res?.data) {
        // 同步到 user store，这样侧边栏也能获取到最新余额
        setCreditsBalance(res.data.balance)
      }
    }
    finally {
      setBalanceLoading(false)
    }
  }, [setCreditsBalance])

  // 获取记录列表
  const fetchRecords = useCallback(async (pageNum: number) => {
    setRecordsLoading(true)
    try {
      const res = await getCreditsRecordsApi({ page: pageNum, pageSize: PAGE_SIZE })
      if (res?.data) {
        const { list, totalPages: total } = res.data
        setRecords(list)
        setTotalPages(total)
        setPage(pageNum)
      }
    }
    finally {
      setRecordsLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    fetchBalance()
    fetchRecords(1)
  }, [fetchBalance, fetchRecords])

  // 切换页码
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      fetchRecords(newPage)
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(/\//g, '-')
  }

  // 生成分页按钮
  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages: (number | 'ellipsis')[] = []
    const showPages = 5 // 最多显示的页码数

    if (totalPages <= showPages) {
      // 总页数小于等于 showPages，全部显示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    }
    else {
      // 总页数大于 showPages，需要省略
      if (page <= 3) {
        // 当前页靠前
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages)
      }
      else if (page >= totalPages - 2) {
        // 当前页靠后
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      }
      else {
        // 当前页在中间
        pages.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages)
      }
    }

    return (
      <div className="mt-4 flex items-center justify-center gap-1">
        {/* 上一页 */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1 || recordsLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 页码 */}
        {pages.map((p, index) => (
          p === 'ellipsis'
            ? (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              )
            : (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(p)}
                  disabled={recordsLoading}
                >
                  {p}
                </Button>
              )
        ))}

        {/* 下一页 */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages || recordsLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 余额卡片 */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">{t('subscription.balance')}</span>
            </div>
            {balanceLoading || creditsLoading
              ? (
                  <Skeleton className="mt-2 h-10 w-32" />
                )
              : (
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      ${centsToUsd(creditsBalance)}
                    </span>
                  </div>
                )}
          </div>
          <Button>{t('subscription.upgrade')}</Button>
        </div>
      </div>

      {/* 使用记录 */}
      <div>
        <h4 className="mb-4 text-sm font-medium text-foreground">
          {t('subscription.usageRecords')}
        </h4>

        {/* 表头 */}
        <div className="grid grid-cols-12 gap-4 border-b border-border px-2 pb-3 text-xs font-medium text-muted-foreground">
          <div className="col-span-6">{t('subscription.detail')}</div>
          <div className="col-span-3">{t('subscription.date')}</div>
          <div className="col-span-3 text-right">{t('subscription.amountChange')}</div>
        </div>

        {/* 记录列表 */}
        <div className="divide-y divide-border">
          {recordsLoading
            ? (
                // 骨架屏
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 px-2 py-3">
                    <div className="col-span-6">
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="col-span-3">
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))
              )
            : records.length === 0
              ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t('subscription.noRecords')}
                  </div>
                )
              : (
                  records.map(record => (
                    <div
                      key={record.id}
                      className="grid grid-cols-12 gap-4 px-2 py-3 text-sm"
                    >
                      {/* 详情 */}
                      <div className="col-span-6 truncate text-foreground">
                        {record.description || t(`subscription.types.${record.type}`)}
                      </div>
                      {/* 日期 */}
                      <div className="col-span-3 text-muted-foreground">
                        {formatDate(record.createdAt)}
                      </div>
                      {/* 金额变更 */}
                      <div
                        className={cn(
                          'col-span-3 text-right font-medium',
                          record.amount >= 0 ? 'text-green-600' : 'text-foreground',
                        )}
                      >
                        {formatAmountChange(record.amount)}
                      </div>
                    </div>
                  ))
                )}
        </div>

        {/* 分页器 */}
        {!recordsLoading && records.length > 0 && renderPagination()}
      </div>
    </div>
  )
}
