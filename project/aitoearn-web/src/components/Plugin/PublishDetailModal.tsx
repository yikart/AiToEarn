/**
 * PublishDetailModal - 发布进度弹框组件
 * 统一展示自动发布、发布任务和需要用户完成的平台进度
 */

'use client'

import type {
  PlatformPublishMode,
  PlatformPublishTask,
  PublishTask,
} from '@/store/plugin/types/baseTypes'
import { CircleOff, ExternalLink, Loader2, Minimize2, Smartphone } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCode } from 'react-qrcode-logo'
import { cancelChannelPublishTaskApi } from '@/api/channels/channel.api'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { PlatType } from '@/app/config/platConfig'
import { OssImage } from '@/components/common/OssImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDouyinPublishSession } from '@/hooks/useDouyinPublishSession'
import { useAccountStore } from '@/store/account'
import { getPlatformInfoSync } from '@/store/platformMetadata'
import { usePluginStore } from '@/store/plugin'
import { PlatformTaskStatus } from '@/store/plugin/types/baseTypes'
import { openDeepLink } from '@/utils/appLaunch'
import { cn } from '@/utils/className'
import { toast } from '@/utils/ui/toast'

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

function getPlatformName(platform: PlatType) {
  const platInfo = getPlatformInfoSync(platform)
  return platInfo?.name || platform
}

function getStatusClassName(status: PlatformTaskStatus) {
  switch (status) {
    case PlatformTaskStatus.COMPLETED:
      return 'bg-success/10 text-success'
    case PlatformTaskStatus.PUBLISHING:
      return 'bg-info/10 text-info'
    case PlatformTaskStatus.ERROR:
      return 'bg-destructive/10 text-destructive'
    case PlatformTaskStatus.CANCELED:
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-muted text-foreground'
  }
}

function getProgressColor(status: PlatformTaskStatus) {
  switch (status) {
    case PlatformTaskStatus.COMPLETED:
      return 'bg-success'
    case PlatformTaskStatus.ERROR:
      return 'bg-destructive'
    case PlatformTaskStatus.PUBLISHING:
      return 'bg-gradient-back'
    default:
      return 'bg-muted-foreground/30'
  }
}

function StatusBadge({ status, label }: { status: PlatformTaskStatus, label: string }) {
  return (
    <Badge className={cn('shrink-0 gap-1.5', getStatusClassName(status))}>
      {status === PlatformTaskStatus.PUBLISHING && <Loader2 aria-hidden className="h-3 w-3 animate-spin" />}
      {label}
    </Badge>
  )
}

function getSectionOrder(mode: PlatformPublishMode) {
  if (mode === 'user_action')
    return 0
  if (mode === 'auto')
    return 1
  return 2
}

function getTaskGroups(platformTasks: PlatformPublishTask[]) {
  const groups = new Map<PlatformPublishMode, PlatformPublishTask[]>()
  platformTasks.forEach((platformTask) => {
    const mode = platformTask.publishMode || 'auto'
    groups.set(mode, [...(groups.get(mode) || []), platformTask])
  })

  return Array.from(groups.entries())
    .sort(([leftMode], [rightMode]) => getSectionOrder(leftMode) - getSectionOrder(rightMode))
    .map(([mode, tasks]) => ({ mode, tasks }))
}

function AccountAvatar({ platformTask }: { platformTask: PlatformPublishTask }) {
  const accountMap = useAccountStore(state => state.accountMap)
  const account = platformTask.accountId ? accountMap.get(platformTask.accountId) : null
  const platInfo = getPlatformInfoSync(platformTask.platform)
  const fallbackText = account?.nickname?.charAt(0) || '?'

  return (
    <div className="relative shrink-0">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-sm font-medium text-muted-foreground">
        {account?.avatar
          ? (
              <OssImage
                src={account.avatar}
                alt={account.nickname || platInfo?.name || 'account'}
                width={40}
                height={40}
                className="h-full w-full object-cover"
                thumbnailSize={40}
              />
            )
          : fallbackText}
      </div>
      {platInfo?.icon && (
        <div className="absolute -bottom-1 -right-1 h-5 w-5 overflow-hidden rounded-full border-2 border-background bg-background">
          <OssImage src={platInfo.icon} alt={platInfo.name} width={20} height={20} thumbnailSize={20} />
        </div>
      )}
    </div>
  )
}

type Translate = (key: string, options?: Record<string, string | number>) => string

const USER_ACTION_QR_CODE_SIZE = 200

function getSectionTitle(mode: PlatformPublishMode, t: Translate) {
  if (mode === 'user_action')
    return t('publishDetail.sectionUserAction')
  if (mode === 'auto')
    return t('publishDetail.sectionAuto')
  return t('publishDetail.sectionTask')
}

function getSectionTitleWithCount(mode: PlatformPublishMode, count: number, t: Translate) {
  return t('publishDetail.sectionTitleWithCount', {
    title: getSectionTitle(mode, t),
    count,
  })
}

function getTaskDisplayStatus(platformTask: PlatformPublishTask, t: (key: string) => string) {
  if (platformTask.status === PlatformTaskStatus.CANCELED)
    return t('common.canceled')

  if (platformTask.publishMode === 'user_action' && platformTask.status === PlatformTaskStatus.PENDING)
    return t('publishDetail.actionRequired')

  if (platformTask.publishMode === 'task' && platformTask.status === PlatformTaskStatus.COMPLETED)
    return t('publishDetail.taskCreated')

  return t(`common.${platformTask.status}`)
}

function UserActionPanel({ taskId, platformTask }: { taskId: string, platformTask: PlatformPublishTask }) {
  const { t } = useTranslation('plugin')
  const platformName = getPlatformName(platformTask.platform)
  const [launching, setLaunching] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const sessionKey = platformTask.publishRecordId
    ? `publish-detail:${platformTask.publishRecordId}`
    : ''
  const updatePlatformTask = usePluginStore(state => state.updatePlatformTask)

  const handleDouyinPublished = useCallback(async (publishSession: { publishRecordId: string, workLink?: string }) => {
    updatePlatformTask(taskId, platformTask.id, {
      status: PlatformTaskStatus.COMPLETED,
      progress: {
        stage: 'complete',
        progress: 100,
        message: t('publishDetail.userActionPublished'),
        timestamp: Date.now(),
      },
      result: {
        success: true,
        workId: publishSession.publishRecordId,
        shareLink: publishSession.workLink,
      },
      endTime: Date.now(),
    })
    await useCalendarTiming.getState().refreshCurrentPubRecords()
  }, [platformTask.id, t, taskId, updatePlatformTask])

  const { session, polling, createSession, clearSession } = useDouyinPublishSession({
    sessionKey,
    enabled: platformTask.platform === PlatType.Douyin && !!platformTask.publishRecordId && !!platformTask.userAction,
    onPublished: handleDouyinPublished,
  })

  useEffect(() => {
    if (platformTask.platform !== PlatType.Douyin || !sessionKey || !platformTask.publishRecordId || !platformTask.userAction)
      return

    if (session?.publishRecordId === platformTask.publishRecordId)
      return

    createSession({
      publishRecordId: platformTask.publishRecordId,
      shortLink: platformTask.userAction.shortLink,
      permalink: platformTask.userAction.schemeUrl,
      status: 'polling',
    })
  }, [
    createSession,
    platformTask.platform,
    platformTask.publishRecordId,
    platformTask.userAction?.schemeUrl,
    platformTask.userAction?.shortLink,
    session?.publishRecordId,
    sessionKey,
  ])

  useEffect(() => {
    if (session?.status !== 'failed')
      return

    const errorMessage = session.errorMsg || t('publishDetail.userActionFailed')
    updatePlatformTask(taskId, platformTask.id, {
      status: PlatformTaskStatus.ERROR,
      error: errorMessage,
      result: {
        success: false,
        failReason: errorMessage,
      },
      endTime: Date.now(),
    })
  }, [platformTask.id, session?.errorMsg, session?.status, t, taskId, updatePlatformTask])

  const handleOpenPlatform = () => {
    if (!platformTask.userAction?.schemeUrl)
      return

    setLaunching(true)
    openDeepLink(platformTask.userAction.schemeUrl, {
      fallbackUrl: platformTask.userAction.shortLink,
      onFailed: () => {
        setLaunching(false)
        toast.error(t('publishDetail.openPlatformFailed', { platform: platformName }))
      },
    })
    window.setTimeout(() => setLaunching(false), 1800)
  }

  const handleCancelPublish = async () => {
    const publishRecordId = platformTask.publishRecordId
    if (!publishRecordId || canceling)
      return

    setCanceling(true)
    try {
      const res = await cancelChannelPublishTaskApi(publishRecordId)
      if (!res || res.code !== 0) {
        toast.error(res?.message || t('publishDetail.cancelPublishFailed'))
        return
      }

      updatePlatformTask(taskId, platformTask.id, {
        status: PlatformTaskStatus.CANCELED,
        error: null,
        progress: null,
        result: null,
        endTime: Date.now(),
      })
      clearSession()
      await useCalendarTiming.getState().refreshCurrentPubRecords()
      toast.success(t('publishDetail.cancelPublishSuccess'))
    }
    finally {
      setCanceling(false)
    }
  }

  if (!platformTask.userAction) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        {t('publishDetail.preparingUserAction', { platform: platformName })}
      </div>
    )
  }

  return (
    <div className="mt-3 grid gap-4 border-t border-border pt-3 md:grid-cols-[auto_1fr]">
      <div className="hidden w-fit items-center justify-center rounded-lg border border-border bg-card p-4 shadow-sm md:flex">
        <QRCode value={platformTask.userAction.shortLink} size={USER_ACTION_QR_CODE_SIZE} quietZone={8} qrStyle="squares" eyeRadius={4} />
      </div>
      <div className="min-w-0 space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {t('publishDetail.userActionTitle', { platform: platformName })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground md:hidden">
            {t('publishDetail.userActionMobileDesc', { platform: platformName })}
          </p>
          <p className="mt-1 hidden text-xs text-muted-foreground md:block">
            {t('publishDetail.userActionQrDesc', { platform: platformName })}
          </p>
          {polling && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('publishDetail.userActionPolling')}
            </p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full cursor-pointer md:hidden"
          disabled={launching || canceling}
          onClick={handleOpenPlatform}
        >
          {launching && <Loader2 className="h-4 w-4 animate-spin" />}
          <Smartphone className="h-4 w-4" />
          {t('publishDetail.openPlatform', { platform: platformName })}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full cursor-pointer border-warning/30 text-warning hover:bg-warning/10 hover:text-warning md:w-fit"
          disabled={canceling}
          onClick={handleCancelPublish}
        >
          {canceling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CircleOff className="h-4 w-4" />
          )}
          {t('publishDetail.cancelPublish')}
        </Button>
      </div>
    </div>
  )
}

function PlatformTaskCard({ taskId, platformTask }: { taskId: string, platformTask: PlatformPublishTask }) {
  const { t } = useTranslation('plugin')
  const accountMap = useAccountStore(state => state.accountMap)
  const account = platformTask.accountId ? accountMap.get(platformTask.accountId) : null
  const progress = platformTask.progress?.progress || 0
  const platformName = getPlatformName(platformTask.platform)
  const isAutoPublish = platformTask.publishMode === 'auto'
  const isUserActionPublish = platformTask.publishMode === 'user_action'
  const showResultBlock = !!platformTask.result && (
    platformTask.result.failReason
    || ((isAutoPublish || isUserActionPublish) && (platformTask.result.workId || platformTask.result.shareLink))
  )

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AccountAvatar platformTask={platformTask} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {account?.nickname || t('publishDetail.unknownAccount')}
            </span>
            <span className="text-xs text-muted-foreground">
              {platformName}
            </span>
          </div>
        </div>

        <StatusBadge status={platformTask.status} label={getTaskDisplayStatus(platformTask, t)} />
      </div>

      {platformTask.publishMode === 'user_action' && platformTask.status === PlatformTaskStatus.PENDING && (
        <UserActionPanel taskId={taskId} platformTask={platformTask} />
      )}

      {platformTask.publishMode === 'auto' && platformTask.status === PlatformTaskStatus.PENDING && !platformTask.progress && (
        <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          {t('publishDetail.autoPendingDesc')}
        </p>
      )}

      {isAutoPublish && platformTask.progress && (
        <div className="mt-3">
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

      {showResultBlock && (
        <div className="mt-3 space-y-1 border-t border-border pt-3">
          {(isAutoPublish || isUserActionPublish) && platformTask.result?.workId && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {t('publishDetail.workId')}
                :
              </span>
              <span className="text-foreground">{platformTask.result.workId}</span>
            </div>
          )}
          {(isAutoPublish || isUserActionPublish) && platformTask.result?.shareLink && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {t('publishDetail.shareLink')}
                :
              </span>
              <a
                href={platformTask.result.shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:text-primary/80"
              >
                <ExternalLink className="h-3 w-3" />
                {t('common.viewLink')}
              </a>
            </div>
          )}
          {platformTask.result?.failReason && (
            <div className="flex items-start gap-2 text-xs">
              <span className="shrink-0 text-muted-foreground">
                {t('publishDetail.failReason')}
                :
              </span>
              <span className="text-destructive">{platformTask.result.failReason}</span>
            </div>
          )}
        </div>
      )}

      {platformTask.error && !platformTask.result?.failReason && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs text-destructive">{platformTask.error}</p>
        </div>
      )}
    </div>
  )
}

function PublishTaskSection({ taskId, mode, platformTasks }: { taskId: string, mode: PlatformPublishMode, platformTasks: PlatformPublishTask[] }) {
  const { t } = useTranslation('plugin')

  if (platformTasks.length === 0)
    return null

  return (
    <section className="space-y-2">
      <h4 className="text-sm font-medium text-foreground">
        {getSectionTitleWithCount(mode, platformTasks.length, t)}
      </h4>
      <div className="space-y-3">
        {platformTasks.map(platformTask => (
          <PlatformTaskCard key={platformTask.id} taskId={taskId} platformTask={platformTask} />
        ))}
      </div>
    </section>
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
      return state.publishTasks.find(item => item.id === taskId)
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

  const taskGroups = getTaskGroups(currentTask.platformTasks)
  const processingCount = currentTask.platformTasks.filter(platformTask => platformTask.status === PlatformTaskStatus.PUBLISHING).length
  const actionRequiredCount = currentTask.platformTasks.filter(platformTask => (
    platformTask.publishMode === 'user_action' && platformTask.status === PlatformTaskStatus.PENDING
  )).length
  const hasProcessing = processingCount > 0 || currentTask.platformTasks.some(platformTask => (
    platformTask.publishMode === 'task' && platformTask.status === PlatformTaskStatus.PENDING
  ))
  const title = hasProcessing || actionRequiredCount > 0
    ? t('publishDetail.progressTitle')
    : t('publishDetail.completeTitle')
  const statusLabel = actionRequiredCount > 0 && currentTask.overallStatus === PlatformTaskStatus.PENDING
    ? t('publishDetail.actionRequired')
    : t(`common.${currentTask.overallStatus}`)

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={(
        <div className="flex w-full items-center justify-between gap-3 pr-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate">{title}</span>
            <StatusBadge status={currentTask.overallStatus} label={statusLabel} />
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
      width={640}
      zIndex={1000}
      closable={false}
    >
      <div className="space-y-4">
        {taskGroups.map(group => (
          <PublishTaskSection key={group.mode} taskId={currentTask.id} mode={group.mode} platformTasks={group.tasks} />
        ))}
      </div>
    </Modal>
  )
}
