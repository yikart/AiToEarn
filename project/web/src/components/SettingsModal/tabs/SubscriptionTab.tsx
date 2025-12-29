/**
 * SubscriptionTab - 订阅 Tab
 * 显示用户余额和使用记录
 */

'use client'

import type { CreditsRecordVo } from '@/api/credits'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  centsToUsd,

  formatAmountChange,
  getCreditsBalanceApi,
  getCreditsRecordsApi,
} from '@/api/credits'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'

/** 每页显示的记录数 */
const PAGE_SIZE = 10

export function SubscriptionTab() {
  const { t } = useTransClient('settings')

  // 从 user store 读取余额状态
  const { creditsBalance, creditsLoading, setCreditsBalance, userInfo } = useUserStore(
    useShallow(state => ({
      creditsBalance: state.creditsBalance,
      creditsLoading: state.creditsLoading,
      setCreditsBalance: state.setCreditsBalance,
      userInfo: state.userInfo,
    })),
  )

  // 判断用户是否为有效会员
  const isVip = useMemo(() => {
    const vipInfo = userInfo?.vipInfo
    if (!vipInfo || !vipInfo.expireTime)
      return false

    // 检查状态是否为有效会员状态（排除 expired 和 none）
    const validStatuses = [
      'trialing',
      'monthly_once',
      'yearly_once',
      'active_monthly',
      'active_yearly',
      'active_nonrenewing',
    ]
    if (!validStatuses.includes(vipInfo.status))
      return false

    // 检查过期时间是否未过期
    return new Date(vipInfo.expireTime) > new Date()
  }, [userInfo])

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
    if (totalPages <= 1)
      return null

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
    <div className="w-full space-y-6">
      {/* 余额卡片 */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{t('subscription.balance')}</span>
            </div>
            {balanceLoading || creditsLoading
              ? (
                  <Skeleton className="mt-2 h-10 w-32" />
                )
              : (
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      $
                      {centsToUsd(creditsBalance)}
                    </span>
                  </div>
                )}
          </div>
          {!isVip && (
            <Button className="shrink-0" onClick={() => window.open('/pricing', '_blank')}>
              {t('subscription.upgrade')}
            </Button>
          )}
        </div>
        {/* Agent 价格链接 */}
        <div className="pt-4 text-center">
          <a
            href="https://docs.aitoearn.ai/en/help-center/pricing/agent-price"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline break-words"
          >
            {t('subscription.viewAgentPricing')}
          </a>
        </div>
      </div>

      {/* 使用记录 */}
      <div className="w-full min-w-0">
        <h4 className="mb-4 text-sm font-medium text-foreground">
          {t('subscription.usageRecords')}
        </h4>

        {/* 表格容器 */}
        <div className="w-full">
          {/* 表头 */}
          <div className="flex items-center border-b border-border px-2 pb-3 text-xs font-medium text-muted-foreground">
            <div className="min-w-0 flex-1">{t('subscription.detail')}</div>
            <div className="hidden w-[140px] shrink-0 text-right md:block">{t('subscription.date')}</div>
            <div className="w-[70px] shrink-0 text-right md:w-[90px]">{t('subscription.amount')}</div>
          </div>

          {/* 记录列表 */}
          <div className="divide-y divide-border">
            {recordsLoading
              ? (
                  // 骨架屏
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center px-2 py-3">
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                      <div className="hidden w-[140px] shrink-0 md:block">
                        <Skeleton className="ml-auto h-4 w-24" />
                      </div>
                      <div className="w-[70px] shrink-0 md:w-[90px]">
                        <Skeleton className="ml-auto h-4 w-12" />
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
                        className="flex items-center px-2 py-3 text-sm"
                      >
                        {/* 详情 */}
                        <div className="min-w-0 flex-1 truncate text-foreground">
                          {record.description || t(`subscription.types.${record.type}`)}
                        </div>
                        {/* 日期 - 移动端隐藏 */}
                        <div className="hidden w-[140px] shrink-0 text-right text-muted-foreground md:block">
                          {formatDate(record.createdAt)}
                        </div>
                        {/* 金额变更 */}
                        <div
                          className={cn(
                            'w-[70px] shrink-0 text-right font-medium tabular-nums md:w-[90px]',
                            record.amount >= 0 ? 'text-green-600' : 'text-foreground',
                          )}
                        >
                          {formatAmountChange(record.amount)}
                        </div>
                      </div>
                    ))
                  )}
          </div>
        </div>

        {/* 分页器 */}
        {!recordsLoading && records.length > 0 && renderPagination()}
      </div>

    </div>
  )
}
