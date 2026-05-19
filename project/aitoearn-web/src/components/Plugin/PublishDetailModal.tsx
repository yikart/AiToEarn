/**
 * PublishDetailModal - 发布详情弹框组件
 * 显示单次发布任务中多个平台的详细进度
 */

'use client'

import type {
  PlatformPublishTask,
  PluginPlatformType,
  PublishTask,
} from '@/store/plugin/types/baseTypes'
import dayjs from 'dayjs'
import { ExternalLink, Loader2, Minimize2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { usePluginStore } from '@/store/plugin'
import { PlatformTaskStatus } from '@/store/plugin/types/baseTypes'
import { getOssUrl } from '@/utils/oss'

/**
 * 组件属性
 */
export interface PublishDetailModalProps {
  /** 是否显示 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 任务ID（二选一） */
  taskId?: string
  /** 任务对象（二选一） */
  task?: PublishTask
  /** 发布完成后是否自动关闭弹框（默认 false） */
  autoCloseOnComplete?: boolean
}

/**
 * 获取平台显示名称
 */
function getPlatformName(platform: PluginPlatformType): string {
  const platInfo = AccountPlatInfoMap.get(platform)
  return platInfo?.name || platform
}

/**
 * 获取状态 Badge 类名
 */
function getStatusClassName(status: PlatformTaskStatus): string {
  switch (status) {
    case PlatformTaskStatus.COMPLETED:
      return 'bg-green-100 text-green-700'
    case PlatformTaskStatus.PUBLISHING:
      return 'bg-blue-100 text-blue-700'
    case PlatformTaskStatus.ERROR:
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-muted text-foreground'
  }
}

/**
 * 获取进度条颜色
 */
function getProgressColor(status: PlatformTaskStatus): string {
  switch (status) {
    case PlatformTaskStatus.COMPLETED:
      return 'bg-green-500'
    case PlatformTaskStatus.ERROR:
      return 'bg-red-500'
    case PlatformTaskStatus.PUBLISHING:
      return 'bg-blue-500'
    default:
      return 'bg-muted-foreground/30'
  }
}

/**
 * 平台任务卡片组件
 */
function PlatformTaskCard({ platformTask }: { platformTask: PlatformPublishTask }) {
  const { t } = useTranslation('plugin')
  const accountMap = useAccountStore(state => state.accountMap)

  const account = platformTask.accountId ? accountMap.get(platformTask.accountId) : null
  const platInfo = AccountPlatInfoMap.get(platformTask.platform)
  const progress = platformTask.progress?.progress || 0

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      {/* 头部：账号信息 + 状态 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 头像（带平台角标） */}
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={account?.avatar ? getOssUrl(account.avatar) : undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {account?.nickname?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            {platInfo?.icon && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 overflow-hidden rounded-full border-2 border-background bg-background">
                <Image src={platInfo.icon} alt={platInfo.name} width={20} height={20} />
              </div>
            )}
          </div>

          {/* 账号名称 */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {account?.nickname || t('publishDetail.unknownAccount' as any)}
            </span>
            <span className="text-xs text-muted-foreground">
              {getPlatformName(platformTask.platform as PluginPlatformType)}
            </span>
          </div>
        </div>

        {/* 状态标签 */}
        <Badge className={cn('shrink-0', getStatusClassName(platformTask.status))}>
          {t(`common.${platformTask.status}`)}
        </Badge>
      </div>

      {/* 进度条 */}
      {platformTask.progress && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t(`stage.${platformTask.progress.stage}`)}</span>
            <span className="text-muted-foreground">
              {Math.round(progress)}
              %
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                getProgressColor(platformTask.status),
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          {platformTask.progress.message && (
            <p className="mt-1 text-xs text-muted-foreground">{platformTask.progress.message}</p>
          )}
        </div>
      )}

      {/* 结果信息 */}
      {platformTask.result && (
        <div className="space-y-1 border-t border-border pt-3">
          {platformTask.result.workId && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {t('publishDetail.workId')}
                :
              </span>
              <span className="text-foreground">{platformTask.result.workId}</span>
            </div>
          )}
          {platformTask.result.shareLink && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {t('publishDetail.shareLink')}
                :
              </span>
              <a
                href={platformTask.result.shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
              >
                <ExternalLink className="h-3 w-3" />
                {t('common.viewLink')}
              </a>
            </div>
          )}
          {platformTask.result.failReason && (
            <div className="flex items-start gap-2 text-xs">
              <span className="shrink-0 text-muted-foreground">
                {t('publishDetail.failReason')}
                :
              </span>
              <span className="text-red-600">{platformTask.result.failReason}</span>
            </div>
          )}
        </div>
      )}

      {/* 错误信息 */}
      {platformTask.error && !platformTask.result?.failReason && (
        <div className="border-t border-border pt-3">
          <p className="text-xs text-red-600">{platformTask.error}</p>
        </div>
      )}

      {/* 时间信息 */}
      {(platformTask.startTime || platformTask.endTime) && (
        <div className="mt-3 flex gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          {platformTask.startTime && (
            <span>
              {t('common.startTime')}
              :
              {dayjs(platformTask.startTime).format('HH:mm:ss')}
            </span>
          )}
          {platformTask.endTime && (
            <span>
              {t('common.endTime')}
              :
              {dayjs(platformTask.endTime).format('HH:mm:ss')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 发布详情弹框组件
 */
export function PublishDetailModal({ visible, onClose, taskId, task, autoCloseOnComplete = false }: PublishDetailModalProps) {
  const { t } = useTranslation('plugin')
  const [minimizeTooltipOpen, setMinimizeTooltipOpen] = useState(false)
  const ignoreInitialMinimizeTooltipOpenRef = useRef(visible)
  const wasVisibleRef = useRef(visible)
  const isCreatingRecord = usePluginStore(state => state.isCreatingRecord)
  const registerPublishDetailModalOpen = usePluginStore(state => state.registerPublishDetailModalOpen)
  const unregisterPublishDetailModalOpen = usePluginStore(state => state.unregisterPublishDetailModalOpen)

  if (visible && !wasVisibleRef.current) {
    ignoreInitialMinimizeTooltipOpenRef.current = true
  }

  // 从 store 获取任务（支持实时更新）
  const currentTask = usePluginStore((state) => {
    if (taskId) {
      return state.publishTasks.find(t => t.id === taskId)
    }
    return task
  })

  // 自动关闭：仅当 autoCloseOnComplete 为 true 时，发布完成且发布记录创建完毕后自动关闭
  useEffect(() => {
    if (autoCloseOnComplete && currentTask?.overallStatus === PlatformTaskStatus.COMPLETED && !isCreatingRecord) {
      onClose()
    }
  }, [autoCloseOnComplete, currentTask?.overallStatus, isCreatingRecord, onClose])

  useEffect(() => {
    wasVisibleRef.current = visible

    if (!visible) {
      ignoreInitialMinimizeTooltipOpenRef.current = false
      setMinimizeTooltipOpen(false)
      return
    }

    setMinimizeTooltipOpen(false)
    const timer = window.setTimeout(() => {
      ignoreInitialMinimizeTooltipOpenRef.current = false
    }, 300)

    return () => window.clearTimeout(timer)
  }, [visible])

  const handleMinimizeTooltipOpenChange = (open: boolean) => {
    if (open && ignoreInitialMinimizeTooltipOpenRef.current) {
      return
    }

    setMinimizeTooltipOpen(open)
  }

  const hasCurrentTask = !!currentTask

  useEffect(() => {
    if (!visible || !hasCurrentTask)
      return

    registerPublishDetailModalOpen()
    return () => unregisterPublishDetailModalOpen()
  }, [hasCurrentTask, registerPublishDetailModalOpen, unregisterPublishDetailModalOpen, visible])

  if (!currentTask) {
    return null
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={(
        <div className="flex w-full items-center justify-between gap-3 pr-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate">{t('publishDetail.title')}</span>
            <Badge className={cn('shrink-0', getStatusClassName(currentTask.overallStatus))}>
              {t(`common.${currentTask.overallStatus}`)}
            </Badge>
          </div>
          <TooltipProvider delayDuration={150}>
            <Tooltip open={minimizeTooltipOpen} onOpenChange={handleMinimizeTooltipOpenChange}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-primary/30 bg-primary/10 text-primary shadow-sm transition-all hover:border-primary/50 hover:bg-primary/15 hover:text-primary focus-visible:ring-primary/40"
                  onClick={onClose}
                  aria-label={t('publishDetail.minimize')}
                >
                  <Minimize2 aria-hidden className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="z-[1001]">
                {t('publishDetail.minimize')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      footer={isCreatingRecord ? (
        <div className="flex w-full items-center justify-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{t('publishDetail.creatingRecord')}</span>
        </div>
      ) : null}
      width={600}
      zIndex={1000}
      closable={false}
    >
      <div className="space-y-4">
        {/* 任务基本信息 */}
        <div className="rounded-lg bg-muted p-4">
          <h3 className="mb-1 font-medium text-foreground">
            {currentTask.title || t('publishList.untitled' as any)}
          </h3>
          {currentTask.description && (
            <p className="mb-2 text-sm text-muted-foreground">{currentTask.description}</p>
          )}
          <div className="text-xs text-muted-foreground">
            {t('common.createdAt')}
            :
            {dayjs(currentTask.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </div>
        </div>

        {/* 平台任务列表 */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-foreground">
            {t('publishList.platforms')}
            {' '}
            (
            {currentTask.platformTasks.length}
            )
          </h4>
          <div className="space-y-3">
            {currentTask.platformTasks.map(platformTask => (
              <PlatformTaskCard key={platformTask.id} platformTask={platformTask} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
