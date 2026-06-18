/**
 * FansRefreshActions - 频道粉丝数刷新操作区
 * 提供全部平台刷新入口。
 */

'use client'

import type { PlatType } from '@/app/config/platConfig'
import { Loader2, RefreshCw } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'

interface FansRefreshActionsProps {
  refreshingTarget: 'all' | PlatType | null
  refreshProgress: { current: number, total: number } | null
  onRefreshAll: () => void
}

export function FansRefreshActions({
  refreshingTarget,
  refreshProgress,
  onRefreshAll,
}: FansRefreshActionsProps) {
  const { t } = useTransClient('account')
  const isRefreshingAll = refreshingTarget === 'all'
  const isRefreshing = refreshingTarget !== null
  const shouldShowProgress = isRefreshingAll && refreshProgress && refreshProgress.total > 0

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">
          {t('channelManager.refreshFansTitle')}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {t('channelManager.refreshFansDescription')}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          data-testid="cm-refresh-all-fans-btn"
          type="button"
          size="sm"
          disabled={isRefreshing}
          className="cursor-pointer rounded-full bg-gradient-back text-gradient-foreground hover:opacity-90"
          onClick={onRefreshAll}
        >
          {isRefreshingAll ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-4 w-4" />
          )}
          {t('channelManager.refreshAllFans')}
          {shouldShowProgress ? (
            <span className="ml-1.5 rounded-full bg-background/20 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-gradient-foreground ring-1 ring-gradient-foreground/30">
              {refreshProgress.current}
              /
              {refreshProgress.total}
            </span>
          ) : null}
        </Button>
      </div>
    </div>
  )
}
