/**
 * VideoCreateDraftTaskWidget - 视频生成草稿任务悬浮窗
 * 在长时间执行期间提供可折叠的进度提示，并提醒用户不要关闭当前页面
 */

'use client'

import type { PlatType } from '@/app/config/platConfig'
import { ChevronUp, Loader2, Minimize2, Sparkles } from 'lucide-react'
import { memo, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePlanDetailStore } from '@/app/[lng]/brand-promotion/planDetailStore'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMediaTabStore } from '../ContentTabs/mediaTabStore'

export const VideoCreateDraftTaskWidget = memo(() => {
  const { t } = useTransClient('material')

  const {
    draftCreationTasks,
    draftCreationWidgetMinimized,
    mediaBatchMode,
    setDraftCreationWidgetMinimized,
  } = useMediaTabStore(
    useShallow(state => ({
      draftCreationTasks: state.draftCreationTasks,
      draftCreationWidgetMinimized: state.draftCreationWidgetMinimized,
      mediaBatchMode: state.batchMode,
      setDraftCreationWidgetMinimized: state.setDraftCreationWidgetMinimized,
    })),
  )

  const draftBatchMode = usePlanDetailStore(state => state.batchMode)

  const activeTasks = useMemo(() => {
    return [...Object.values(draftCreationTasks)].sort((a, b) => b.startedAt - a.startedAt)
  }, [draftCreationTasks])

  const visibleTasks = activeTasks.slice(0, 2)
  const extraTaskCount = Math.max(activeTasks.length - visibleTasks.length, 0)
  const hasBottomBar = draftBatchMode || mediaBatchMode

  useEffect(() => {
    if (activeTasks.length === 0)
      return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      return ''
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [activeTasks.length])

  if (activeTasks.length === 0) {
    return null
  }

  const positionClassName = hasBottomBar
    ? 'bottom-24 sm:bottom-20'
    : 'bottom-4 sm:bottom-6'

  if (draftCreationWidgetMinimized) {
    return (
      <button
        type="button"
        onClick={() => setDraftCreationWidgetMinimized(false)}
        className={cn(
          'fixed right-4 z-40 flex w-[min(320px,calc(100vw-32px))] cursor-pointer items-center gap-3 rounded-full border border-primary/20 bg-background/95 px-4 py-3 text-left shadow-2xl shadow-primary/10 backdrop-blur-md transition-all duration-200 hover:border-primary/30 hover:shadow-primary/15',
          positionClassName,
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {t('mediaManagement.createDraftTaskCompactTitle', { count: activeTasks.length })}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {t('mediaManagement.createDraftTaskCompactDesc')}
          </p>
        </div>
        <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'fixed right-4 z-40 w-[min(380px,calc(100vw-32px))] rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-md',
        positionClassName,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {t('mediaManagement.createDraftTaskRunningTitle')}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t('mediaManagement.createDraftTaskRunningDesc')}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDraftCreationWidgetMinimized(true)}
              className="h-8 w-8 shrink-0 rounded-full"
            >
              <Minimize2 className="h-4 w-4" />
              <span className="sr-only">{t('mediaManagement.createDraftTaskCollapse')}</span>
            </Button>
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('mediaManagement.createDraftTaskCount', { count: activeTasks.length })}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {visibleTasks.map((task, index) => {
          const platformNames = task.platforms
            .map((platform) => {
              return AccountPlatInfoMap.get(platform as PlatType)?.name || platform
            })
            .join(' / ')

          return (
            <div
              key={task.mediaId}
              className="rounded-xl border border-border/80 bg-muted/35 px-3 py-2.5"
            >
              <p className="line-clamp-1 text-sm font-medium text-foreground">
                {task.mediaTitle || t('mediaManagement.createDraftTaskUntitled', { index: index + 1 })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('mediaManagement.createDraftTaskEta')}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {t('mediaManagement.createDraftTaskPlatforms', {
                  platforms: platformNames,
                  interpolation: { escapeValue: false },
                })}
              </p>
            </div>
          )
        })}

        {extraTaskCount > 0 && (
          <p className="px-1 text-xs text-muted-foreground">
            {t('mediaManagement.createDraftTaskMore', { count: extraTaskCount })}
          </p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-muted/45 px-3 py-2.5">
        <p className="text-xs leading-5 text-muted-foreground">
          {t('mediaManagement.createDraftTaskDoNotClose')}
        </p>
      </div>
    </div>
  )
})

VideoCreateDraftTaskWidget.displayName = 'VideoCreateDraftTaskWidget'
