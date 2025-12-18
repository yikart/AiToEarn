/**
 * BalanceEntry - 余额入口组件
 * 显示用户 Credits 余额，点击打开设置弹框的订阅 Tab
 */

'use client'

import { useEffect } from 'react'
import { DollarSign } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import { centsToUsd } from '@/api/credits'
import type { SidebarCommonProps } from '../../types'

interface BalanceEntryProps extends SidebarCommonProps {
  /** 点击时打开设置弹框并选中订阅 Tab */
  onClick: () => void
}

export function BalanceEntry({ collapsed, onClick }: BalanceEntryProps) {
  const { t } = useTransClient('common')

  const { token, creditsBalance, creditsLoading, fetchCreditsBalance } = useUserStore(
    useShallow(state => ({
      token: state.token,
      creditsBalance: state.creditsBalance,
      creditsLoading: state.creditsLoading,
      fetchCreditsBalance: state.fetchCreditsBalance,
    })),
  )

  // 登录后获取余额
  useEffect(() => {
    if (token) {
      fetchCreditsBalance()
    }
  }, [token, fetchCreditsBalance])

  // 未登录不显示
  if (!token) {
    return null
  }

  const content = (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center rounded-lg border-none bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        collapsed ? 'h-9 w-9 justify-center' : 'justify-between px-3 py-2',
      )}
    >
      <div className="flex items-center gap-2">
        <DollarSign size={18} className="text-success" />
        {!collapsed && <span className="text-sm">{t('balance')}</span>}
      </div>
      {!collapsed && (
        creditsLoading ? (
          <Skeleton className="h-4 w-12" />
        ) : (
          <span className="text-xs font-medium text-foreground">
            ${centsToUsd(creditsBalance)}
          </span>
        )
      )}
    </button>
  )

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>
              {t('balance')}: ${centsToUsd(creditsBalance)}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

