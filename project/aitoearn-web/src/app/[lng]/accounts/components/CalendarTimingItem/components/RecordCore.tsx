/**
 * RecordCore 组件
 *
 * 功能描述: 发布记录详情组件
 * - 桌面端：使用 Popover 显示详情
 * - 移动端：使用全屏 Dialog 显示详情
 */

import type { LucideIcon } from 'lucide-react'
import type { ForwardedRef } from 'react'
import type { ChannelPublishUserActionVo, ChannelWorkMetricsSnapshot } from '@/api/channels/channel.types'
import type { PublishRecordEngagement, PublishRecordItem } from '@/api/platforms/publish.types'
import type { PlatformPublishTask } from '@/store/plugin/types/baseTypes'
import dayjs from 'dayjs'
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  CircleOff,
  Clock,
  ExternalLink,
  Eye,
  Heart,
  Info,
  Loader2,
  MessageCircle,
  MoreVertical,
  RotateCcw,
  Send,
  Share2,
  Trash2,
  XCircle,
} from 'lucide-react'
import Image from 'next/image'
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  cancelChannelPublishTaskApi,
  deleteChannelPublishRecordApi,
  getChannelPublishUserActionApi,
  publishChannelTaskNowApi,
  retryChannelPublishTaskApi,
  updateChannelPublishAtApi,
} from '@/api/channels/channel.api'
import { PublishStatus } from '@/api/platforms/publish.constants'
import { ClientType } from '@/app/[lng]/accounts/accounts.enums'
import {
  canCancelPublishRecord,
  canDeletePublishRecord,
  canPublishRecordNow,
  canReschedulePublishRecord,
  canRetryPublishRecord,
  getDays,
  getPublishRecordTaskId,
  getUtcDays,
} from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { useAccountsWorkAnalyticsCacheStore } from '@/app/[lng]/accounts/workAnalyticsCacheStore'
import { PlatType } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import AvatarPlat from '@/components/common/AvatarPlat'
import { MediaPreview } from '@/components/common/MediaPreview'
import { OssImage } from '@/components/common/OssImage'
import { PublishDetailModal } from '@/components/Plugin/PublishDetailModal'
import PublishDatePicker from '@/components/PublishDialog/compoents/PublishDatePicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAccountStore } from '@/store/account'
import { getPlatformInfoSync } from '@/store/platformMetadata'
import { usePluginStore } from '@/store/plugin'
import { PlatformTaskStatus } from '@/store/plugin/types/baseTypes'
import { useSystemStore } from '@/store/system'
import { cn } from '@/utils/className'
import { getOssUrl } from '@/utils/oss'
import { confirm } from '@/utils/ui/confirm'
import { toast } from '@/utils/ui/toast'
import ScrollButtonContainer from './ScrollButtonContainer'

export interface IRecordCoreRef {
  closeDetail: () => void
}

export interface IRecordCoreProps {
  publishRecord: PublishRecordItem
  dragPreviewWidth?: number
}

interface PublishStatusMeta {
  labelKey: string
  icon: LucideIcon
  className?: string
  spin?: boolean
  destructive?: boolean
}

const statusBadgeClassName = {
  info: 'border-info/25 bg-info/10 text-info',
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  muted: 'bg-muted text-muted-foreground border-border',
}

const cancelPublishMenuItemClassName = 'cursor-pointer text-warning focus:bg-warning/10 focus:text-warning'
const deleteRecordMenuItemClassName = 'cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive'

function hasDouyinUserAction(
  data: ChannelPublishUserActionVo | null | undefined,
): data is ChannelPublishUserActionVo & { schemeUrl: string, shortLink: string } {
  return !!data?.schemeUrl && !!data.shortLink
}

function buildUserActionPlatformTask(
  record: PublishRecordItem,
  publishRecordId: string,
  userAction: ChannelPublishUserActionVo & { schemeUrl: string, shortLink: string },
): PlatformPublishTask {
  return {
    id: `record-user-action-${publishRecordId}`,
    platform: record.accountType,
    accountId: record.accountId,
    publishMode: 'user_action',
    publishRecordId,
    userAction: {
      schemeUrl: userAction.schemeUrl,
      shortLink: userAction.shortLink,
      expiresAt: userAction.expiresAt,
    },
    params: {
      type: record.videoUrl ? 'video' : 'image',
      title: record.title,
      desc: record.desc,
      accountId: record.accountId,
      platform: record.accountType,
      video: record.videoUrl,
      cover: record.coverUrl,
      images: record.imgUrlList,
      topics: record.topics,
      scheduledTime: getDays(record.publishTime).valueOf(),
      platformConfig: record.option,
    },
    status: PlatformTaskStatus.PENDING,
    progress: null,
    result: null,
    startTime: null,
    endTime: Date.now(),
    error: null,
  }
}

function normalizeWorkMetrics(metrics?: ChannelWorkMetricsSnapshot): PublishRecordEngagement | undefined {
  if (!metrics || !Object.values(metrics).some(value => typeof value === 'number' && Number.isFinite(value))) {
    return undefined
  }
  return {
    viewCount: metrics.viewCount ?? metrics.playCount ?? 0,
    commentCount: metrics.commentCount ?? 0,
    likeCount: metrics.likeCount ?? 0,
    shareCount: metrics.shareCount ?? 0,
    clickCount: metrics.clickCount ?? 0,
    impressionCount: metrics.impressionCount ?? 0,
    favoriteCount: metrics.collectCount ?? metrics.saveCount ?? 0,
  }
}

const publishStatusMetaMap: Partial<Record<PublishStatus, PublishStatusMeta>> = {
  [PublishStatus.FAIL]: {
    labelKey: 'status.publishFailed',
    icon: XCircle,
    destructive: true,
  },
  [PublishStatus.PUB_LOADING]: {
    labelKey: 'status.publishing',
    icon: Loader2,
    className: statusBadgeClassName.info,
    spin: true,
  },
  [PublishStatus.RELEASED]: {
    labelKey: 'status.publishSuccess',
    icon: CheckCircle2,
    className: statusBadgeClassName.success,
  },
  [PublishStatus.UNPUBLISH]: {
    labelKey: 'status.waitingPublish',
    icon: Clock,
    className: statusBadgeClassName.muted,
  },
  [PublishStatus.WAITING_FOR_UPDATE]: {
    labelKey: 'status.waitingUpdate',
    icon: Clock,
    className: statusBadgeClassName.muted,
  },
  [PublishStatus.UPDATING]: {
    labelKey: 'status.updating',
    icon: Loader2,
    className: statusBadgeClassName.info,
    spin: true,
  },
  [PublishStatus.UPDATED_FAILED]: {
    labelKey: 'status.updateFailed',
    icon: XCircle,
    destructive: true,
  },
  [PublishStatus.QUEUED]: {
    labelKey: 'status.queued',
    icon: Clock,
    className: statusBadgeClassName.warning,
  },
  [PublishStatus.PLATFORM_SCHEDULED]: {
    labelKey: 'status.platformScheduled',
    icon: Calendar,
    className: statusBadgeClassName.muted,
  },
  [PublishStatus.WAITING_FOR_USER_ACTION]: {
    labelKey: 'status.waitingUserAction',
    icon: Clock,
    className: statusBadgeClassName.warning,
  },
  [PublishStatus.CANCELED]: {
    labelKey: 'status.canceled',
    icon: XCircle,
    className: statusBadgeClassName.muted,
  },
}

// 发布状态组件
function PubStatus({ status }: { status: PublishStatus }) {
  const { t } = useTransClient('publish')
  const meta = publishStatusMetaMap[status] ?? {
    labelKey: 'status.unknown',
    icon: Clock,
    className: statusBadgeClassName.muted,
  }
  const Icon = meta.icon

  return (
    <div className="inline-flex items-center">
      <Badge
        variant={meta.destructive ? 'destructive' : 'secondary'}
        className={cn('gap-1.5', meta.className)}
      >
        {t(meta.labelKey)}
        <Icon className={cn('h-3 w-3', meta.spin && 'animate-spin')} />
      </Badge>
    </div>
  )
}

const RecordCore = memo(
  forwardRef(({ publishRecord, dragPreviewWidth }: IRecordCoreProps, ref: ForwardedRef<IRecordCoreRef>) => {
    const isMobile = useIsMobile()
    const { calendarCallWidth, refreshCurrentPubRecords, refreshPubRecordDetail, removePubRecord } = useCalendarTiming(
      useShallow(state => ({
        calendarCallWidth: state.calendarCallWidth,
        refreshCurrentPubRecords: state.refreshCurrentPubRecords,
        refreshPubRecordDetail: state.refreshPubRecordDetail,
        removePubRecord: state.removePubRecord,
      })),
    )
    const { calendarViewType } = useSystemStore(
      useShallow(state => ({
        calendarViewType: state.calendarViewType,
      })),
    )
    const { accountMap } = useAccountStore(
      useShallow(state => ({
        accountMap: state.accountMap,
      })),
    )
    const [popoverOpen, setPopoverOpen] = useState(false)
    const { t } = useTransClient('publish')
    const [nowPubLoading, setNowPubLoading] = useState(false)
    const [retryLoading, setRetryLoading] = useState(false)
    const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
    const [rescheduleLoading, setRescheduleLoading] = useState(false)
    const [reschedulePubTime, setReschedulePubTime] = useState<string>()
    const [mediaPreviewOpen, setMediaPreviewOpen] = useState(false)
    const [mediaPreviewIndex, setMediaPreviewIndex] = useState(0)
    const [workEngagement, setWorkEngagement] = useState<PublishRecordEngagement | null>()
    const [workMetricsFetchedAt, setWorkMetricsFetchedAt] = useState<string | null>()
    const [workMetricsLoading, setWorkMetricsLoading] = useState(false)
    const [continuePublishLoading, setContinuePublishLoading] = useState(false)
    const [publishDetailTaskId, setPublishDetailTaskId] = useState<string>()
    const workMetricsRequestIdRef = useRef(0)
    const activeRecord = publishRecord
    const activeEngagement = activeRecord.status === PublishStatus.RELEASED
      ? (workEngagement === undefined ? activeRecord.engagement : workEngagement)
      : null

    useEffect(() => {
      workMetricsRequestIdRef.current += 1
      setWorkEngagement(undefined)
      setWorkMetricsFetchedAt(undefined)
      setWorkMetricsLoading(false)
    }, [publishRecord.id])

    const loadWorkMetrics = useCallback(async (record: PublishRecordItem, requestId: number) => {
      if (record.status !== PublishStatus.RELEASED || !record.platformWorkId || !record.accountId) {
        setWorkEngagement(null)
        setWorkMetricsFetchedAt(null)
        return
      }

      const cacheStore = useAccountsWorkAnalyticsCacheStore.getState()
      const cachedAnalytics = cacheStore.getAnalytics(record.accountType, record.platformWorkId, record.accountId)
      if (cachedAnalytics) {
        if (workMetricsRequestIdRef.current === requestId) {
          setWorkEngagement(normalizeWorkMetrics(cachedAnalytics.metrics) ?? null)
          setWorkMetricsFetchedAt(cachedAnalytics.fetchedAt ?? null)
        }
        return
      }

      setWorkMetricsLoading(true)
      try {
        const data = await cacheStore.fetchAnalytics(record.accountType, record.platformWorkId, record.accountId)
        if (workMetricsRequestIdRef.current === requestId) {
          setWorkEngagement(normalizeWorkMetrics(data?.metrics) ?? null)
          setWorkMetricsFetchedAt(data?.fetchedAt ?? null)
        }
      }
      catch {
        if (workMetricsRequestIdRef.current === requestId) {
          setWorkEngagement(null)
          setWorkMetricsFetchedAt(null)
        }
      }
      finally {
        if (workMetricsRequestIdRef.current === requestId) {
          setWorkMetricsLoading(false)
        }
      }
    }, [])

    const handlePopoverOpenChange = useCallback((open: boolean) => {
      setPopoverOpen(open)
      if (open) {
        const requestId = workMetricsRequestIdRef.current + 1
        workMetricsRequestIdRef.current = requestId
        setWorkEngagement(undefined)
        setWorkMetricsFetchedAt(undefined)
        void loadWorkMetrics(publishRecord, requestId)
      }
      else {
        workMetricsRequestIdRef.current += 1
        setWorkMetricsLoading(false)
      }
    }, [loadWorkMetrics, publishRecord])

    useImperativeHandle(ref, () => ({
      closeDetail: () => {
        handlePopoverOpenChange(false)
        setRescheduleDialogOpen(false)
      },
    }))

    /**
     * 取消发布按钮显示逻辑
     */
    const shouldShowCancelPublish = useMemo(() => {
      return canCancelPublishRecord(activeRecord.status)
    }, [activeRecord.status])

    const days = useMemo(() => {
      return getDays(activeRecord.publishTime)
    }, [activeRecord])

    const account = useMemo(() => {
      return accountMap.get(activeRecord?.accountId ?? '')
    }, [accountMap, activeRecord.accountId])

    const platIcon = useMemo(() => {
      return getPlatformInfoSync(activeRecord?.accountType ?? PlatType.Xhs)?.icon
    }, [activeRecord])

    const isWxSphRecord = activeRecord.accountType === PlatType.WxSph

    const getClientTypeLabel = (clientType?: ClientType) => {
      if (!clientType)
        return null
      if (clientType === ClientType.WEB) {
        return t('clientType.web')
      }
      if (clientType === ClientType.APP) {
        return t('clientType.app')
      }
      return null
    }

    const recordInfo = useMemo(() => {
      return [
        {
          label: t('record.metrics.views'),
          icon: <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />,
          key: 'viewCount',
        },
        {
          label: t('record.metrics.comments'),
          icon: <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />,
          key: 'commentCount',
        },
        {
          label: t('record.metrics.likes'),
          icon: <Heart className="h-3.5 w-3.5 md:h-4 md:w-4" />,
          key: 'likeCount',
        },
        {
          label: t('record.metrics.shares'),
          icon: <Share2 className="h-3.5 w-3.5 md:h-4 md:w-4" />,
          key: 'shareCount',
        },
      ]
    }, [t])

    const desc = useMemo(() => {
      return `${activeRecord.desc} ${activeRecord.topics ? activeRecord.topics?.map(v => `#${v}`).join(' ') : ''}`
    }, [activeRecord])
    const coverThumbnailSrc = activeRecord.coverUrl || activeRecord.imgUrlList?.[0] || ''

    const mediaPreviewItems = useMemo(() => {
      const items: Array<{ type: 'image' | 'video', src: string }> = []

      if (activeRecord.videoUrl) {
        items.push({
          type: 'video',
          src: getOssUrl(activeRecord.videoUrl),
        })
      }

      if (activeRecord.imgUrlList && activeRecord.imgUrlList.length > 0) {
        activeRecord.imgUrlList.forEach((imgUrl) => {
          items.push({
            type: 'image',
            src: getOssUrl(imgUrl),
          })
        })
      }

      if (items.length === 0 && activeRecord.coverUrl) {
        items.push({
          type: 'image',
          src: getOssUrl(activeRecord.coverUrl),
        })
      }

      return items
    }, [activeRecord])

    const handleCoverClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (mediaPreviewItems.length > 0) {
        setMediaPreviewIndex(0)
        setMediaPreviewOpen(true)
      }
    }

    const handleCoverMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation()
    }

    const handleViewWork = () => {
      if (!activeRecord.workLink)
        return

      window.open(activeRecord.workLink, '_blank')
    }

    const handleCopyWorkLink = async () => {
      if (!activeRecord.workLink)
        return

      await navigator.clipboard.writeText(activeRecord.workLink)
    }

    const shouldShowViewWork = !!activeRecord.workLink
    const shouldShowDeleteRecord = canDeletePublishRecord(activeRecord.status)
    const shouldShowRetryPublish = canRetryPublishRecord(activeRecord.status)
    const shouldShowReschedulePublish = canReschedulePublishRecord(activeRecord.status, activeRecord.publishTime)
    const shouldShowContinueUserActionPublish
      = activeRecord.accountType === PlatType.Douyin && activeRecord.status === PublishStatus.WAITING_FOR_USER_ACTION
    const shouldShowMoreActions
      = shouldShowViewWork || shouldShowCancelPublish || shouldShowDeleteRecord || shouldShowReschedulePublish
    const shouldShowWxSphReviewPending
      = isWxSphRecord && activeRecord.status === PublishStatus.RELEASED && !activeRecord.workLink
    const wxSphReviewPendingTooltip = activeRecord.linkError || t('record.wxSphReviewPendingDesc')
    const handleCancelPublish = async () => {
      await confirm({
        title: t('record.cancelPublishConfirmTitle'),
        content: t('record.cancelPublishConfirmContent'),
        okText: t('buttons.cancelPublish'),
        icon: <CircleOff className="h-4 w-4 text-warning" />,
        onOk: async () => {
          setPopoverOpen(false)
          const res = await cancelChannelPublishTaskApi(getPublishRecordTaskId(activeRecord))
          if (!res || res.code !== 0) {
            return
          }
          await refreshPubRecordDetail(activeRecord.id)
          toast.success(t('record.cancelPublishSuccess'))
        },
      })
    }

    const handleDeleteRecord = async () => {
      if (!canDeletePublishRecord(activeRecord.status)) {
        return
      }

      await confirm({
        title: t('record.deleteConfirmTitle'),
        content: t('record.deleteConfirmContent'),
        okText: t('buttons.delete'),
        okType: 'destructive',
        onOk: async () => {
          setPopoverOpen(false)
          const res = await deleteChannelPublishRecordApi(activeRecord.id)
          if (!res || res.code !== 0) {
            return
          }
          toast.success(t('record.deleteSuccess'))
          removePubRecord(activeRecord.id)
        },
      })
    }

    const handleOpenRescheduleDialog = () => {
      setReschedulePubTime(getDays(activeRecord.publishTime).format())
      setRescheduleDialogOpen(true)
    }

    const handleReschedulePublish = async (nextPubTime?: string) => {
      if (!nextPubTime || !canReschedulePublishRecord(activeRecord.status, activeRecord.publishTime)) {
        return
      }

      setRescheduleLoading(true)
      try {
        const res = await updateChannelPublishAtApi(
          getPublishRecordTaskId(activeRecord),
          getUtcDays(nextPubTime).format(),
        )
        if (!res || res.code !== 0) {
          return
        }

        setRescheduleDialogOpen(false)
        setPopoverOpen(false)
        await refreshPubRecordDetail(activeRecord.id)
        toast.success(t('record.rescheduleSuccess'))
      }
      finally {
        setRescheduleLoading(false)
      }
    }

    const handlePublishNow = async () => {
      setNowPubLoading(true)
      try {
        const res = await publishChannelTaskNowApi(getPublishRecordTaskId(activeRecord))
        if (!res || res.code !== 0) {
          return
        }
        await refreshPubRecordDetail(activeRecord.id)
        toast.success(t('record.publishNowSuccess'))
      }
      finally {
        setNowPubLoading(false)
      }
    }

    const handleContinueUserActionPublish = async () => {
      if (!shouldShowContinueUserActionPublish)
        return

      setContinuePublishLoading(true)
      try {
        const existingTask = usePluginStore.getState().publishTasks.find(task => task.platformTasks.some(platformTask => (
          platformTask.publishMode === 'user_action'
          && platformTask.publishRecordId === activeRecord.id
          && platformTask.status === PlatformTaskStatus.PENDING
        )))

        if (existingTask) {
          setPublishDetailTaskId(existingTask.id)
          setPopoverOpen(false)
          return
        }

        const res = await getChannelPublishUserActionApi(activeRecord.id)
        if (res?.code !== 0 || !hasDouyinUserAction(res.data)) {
          toast.error(res?.message || t('messages.userActionFetchFailed'))
          return
        }

        const publishRecordId = res.data.recordId || activeRecord.id
        const taskId = usePluginStore.getState().addPublishTask({
          title: activeRecord.title,
          description: activeRecord.desc,
          platformTasks: [buildUserActionPlatformTask(activeRecord, publishRecordId, res.data)],
        })
        setPublishDetailTaskId(taskId)
        setPopoverOpen(false)
      }
      finally {
        setContinuePublishLoading(false)
      }
    }

    const handleRetryPublish = async () => {
      if (!canRetryPublishRecord(activeRecord.status)) {
        return
      }

      setRetryLoading(true)
      try {
        const res = await retryChannelPublishTaskApi(getPublishRecordTaskId(activeRecord))
        if (!res || res.code !== 0) {
          return
        }

        if (isMobile) {
          setPopoverOpen(false)
          setRetryLoading(false)
          await refreshCurrentPubRecords()
          toast.success(t('record.retryPublishSuccess'))
          return
        }

        await refreshPubRecordDetail(activeRecord.id)
        toast.success(t('record.retryPublishSuccess'))
      }
      finally {
        setRetryLoading(false)
      }
    }

    const shouldShowRecordMetrics = !isWxSphRecord && (workMetricsLoading || !!activeEngagement)

    // 触发按钮
    const TriggerButton = (
      <Button
        data-testid="record-trigger"
        variant="outline"
        className={cn(
          'flex justify-between items-center box-border w-full h-auto',
          isMobile ? 'px-2.5 py-2.5' : 'px-1.5 py-1.5',
          'bg-card hover:bg-accent border-border',
          'rounded-md transition-colors',
          'text-foreground font-normal',
          'shadow-none cursor-pointer',
        )}
        style={{
          width: dragPreviewWidth ?? (isMobile || calendarViewType === 'week' ? '100%' : `${calendarCallWidth}px`),
        }}
        disabled={retryLoading}
      >
        <div className={cn('flex items-center', isMobile ? 'gap-2.5' : 'gap-1.5')}>
          <Image
            src={platIcon || ''}
            width={28}
            height={28}
            className={cn(isMobile ? 'w-7 h-7' : 'w-[25px] h-[25px]')}
            alt="platform"
            unoptimized
          />
          <div className={cn('font-semibold', isMobile ? 'text-base' : 'text-sm')}>
            {days.format('HH:mm')}
          </div>
        </div>
        {retryLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        ) : coverThumbnailSrc && (
          <div className="flex items-center">
            <OssImage
              src={coverThumbnailSrc}
              width={32}
              height={32}
              sizes={isMobile ? '32px' : '24px'}
              thumbnailSize={64}
              className={cn('rounded object-cover', isMobile ? 'w-8 h-8' : 'w-6 h-6')}
              alt="cover"
            />
          </div>
        )}
      </Button>
    )

    // 详情内容（复用于 Popover 和 Dialog）
    const RecordContent = ({ inDialog = false }: { inDialog?: boolean }) => (
      <div
        className={cn('w-full box-border overflow-hidden', inDialog && 'flex flex-col')}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* 顶部：时间 */}
        <div
          className={cn(
            'flex justify-between items-center border-b border-border p-2.5 md:p-3',
            inDialog && 'shrink-0 pt-4 pr-10',
          )}
        >
          <div className="flex flex-col gap-1">
            {/* 发布时间 */}
            <div className="font-semibold flex items-center gap-2 text-sm md:text-base">
              {days.format('YYYY-MM-DD HH:mm')}
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </div>
            {/* 更新时间 */}
            {workMetricsFetchedAt && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                {t('record.analyticsUpdatedAt')}
                ：
                {dayjs(workMetricsFetchedAt).format('YYYY-MM-DD HH:mm')}
              </div>
            )}
          </div>
        </div>

        {/* 中间：用户信息和内容 */}
        <div
          className={cn(
            'flex flex-col md:flex-row justify-between gap-3 border-b border-border p-2.5 md:p-3 overflow-hidden',
            inDialog && 'overflow-y-auto',
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-2 md:mb-3">
              <AvatarPlat account={account} size={isMobile ? 'default' : 'large'} />
              <span className="ml-2 md:ml-2.5 inline-block font-bold text-sm md:text-base">
                {account?.nickname}
              </span>
              {account?.clientType && (
                <span
                  className={cn(
                    'inline-block px-1.5 py-0.5 rounded text-[10px] md:text-[11px] font-medium ml-2',
                    account.clientType === 'web'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
                      : 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
                  )}
                >
                  {getClientTypeLabel(account.clientType)}
                </span>
              )}
            </div>
            <div
              title={desc}
              className="line-clamp-3 md:line-clamp-2 overflow-hidden text-ellipsis mt-2 md:mt-2.5 pr-0 md:pr-2.5 text-sm md:text-base"
            >
              {desc}
            </div>
            <div className="mt-3 md:mt-4">
              <span data-testid="record-status-badge"><PubStatus status={activeRecord.status} /></span>
            </div>
            {activeRecord.errorMsg && (
              <div title={activeRecord.errorMsg} className="mt-1 text-xs text-destructive">
                {activeRecord.errorMsg}
              </div>
            )}
          </div>

          {/* 媒体预览 */}
          {mediaPreviewItems.length > 0 && coverThumbnailSrc && (
            <div
              className={cn('shrink-0', isMobile ? 'w-full' : '')}
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            >
              <div
                data-cover-preview
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleCoverClick(e)
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleCoverMouseDown(e)
                }}
                className={cn(
                  'rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-border',
                  isMobile ? 'w-full aspect-video' : 'w-[145px] h-[145px]',
                )}
              >
                <OssImage
                  src={coverThumbnailSrc}
                  width={290}
                  height={290}
                  sizes={isMobile ? 'calc(100vw - 48px)' : '145px'}
                  thumbnailWidth={isMobile ? 720 : 320}
                  thumbnailHeight={isMobile ? 405 : 320}
                  className="w-full h-full object-cover pointer-events-none"
                  alt="cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* 信息指标 */}
        {shouldShowRecordMetrics && (
          <ScrollButtonContainer>
            <div className="flex gap-3 md:gap-4 p-2 md:p-2.5 border-b border-border overflow-x-auto">
              {workMetricsLoading
                ? recordInfo.map(v => (
                    <div key={v.label} className="flex-shrink-0 md:flex-1 min-w-[60px] md:min-w-0">
                      <div className="flex items-center gap-1 md:gap-1.5">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="mt-2 h-4 w-10" />
                    </div>
                  ))
                : recordInfo.map(v => (
                    <div key={v.label} className="flex-shrink-0 md:flex-1 min-w-[60px] md:min-w-0">
                      <div className="flex items-center gap-1 md:gap-1.5">
                        {v.icon}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{v.label}</span>
                      </div>
                      {activeEngagement && (
                        <div className="text-sm md:text-base font-semibold mt-0.5 md:mt-1">
                          {activeEngagement[v.key as 'viewCount'] ?? 0}
                        </div>
                      )}
                    </div>
                  ))}
            </div>
          </ScrollButtonContainer>
        )}

        {/* 底部：操作按钮 */}
        <div
          className={cn(
            'flex gap-2 md:gap-2.5 p-2.5 md:p-3',
            isMobile ? 'flex-col' : 'flex-row justify-end',
            inDialog && 'shrink-0',
          )}
        >
          {/* 移动端：查看作品 + 更多操作 同一排 */}
          {isMobile && (shouldShowViewWork || shouldShowRetryPublish || shouldShowMoreActions) ? (
            <div className="flex gap-2 w-full">
              {shouldShowViewWork && (
                <Button
                  data-testid="record-view-work-btn"
                  className="cursor-pointer flex-1"
                  onClick={handleViewWork}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('record.viewWork')}
                </Button>
              )}
              {shouldShowRetryPublish && (
                <Button
                  data-testid="record-retry-btn"
                  variant="outline"
                  className={cn(
                    'cursor-pointer border-primary/30 text-primary hover:bg-primary/10 hover:text-primary',
                    shouldShowViewWork ? 'shrink-0' : 'flex-1',
                  )}
                  disabled={retryLoading}
                  onClick={handleRetryPublish}
                >
                  {retryLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-4 w-4" />
                  )}
                  {t('buttons.retryPublish')}
                </Button>
              )}
              {shouldShowMoreActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button data-testid="record-more-btn" variant="outline" size="icon" className="cursor-pointer shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {shouldShowViewWork && (
                      <DropdownMenuItem onClick={handleCopyWorkLink}>
                        {t('buttons.copyLink')}
                      </DropdownMenuItem>
                    )}
                    {shouldShowReschedulePublish && (
                      <DropdownMenuItem onClick={handleOpenRescheduleDialog}>
                        <CalendarClock className="h-4 w-4" />
                        {t('buttons.reschedulePublish')}
                      </DropdownMenuItem>
                    )}
                    {shouldShowCancelPublish && (
                      <DropdownMenuItem
                        className={cancelPublishMenuItemClassName}
                        onClick={handleCancelPublish}
                      >
                        <CircleOff className="h-4 w-4" />
                        {t('buttons.cancelPublish')}
                      </DropdownMenuItem>
                    )}
                    {shouldShowDeleteRecord && (
                      <DropdownMenuItem
                        className={deleteRecordMenuItemClassName}
                        onClick={handleDeleteRecord}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('buttons.delete')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ) : (
            // 桌面端或移动端无更多操作时
            <>
              {shouldShowViewWork && (
                <Button
                  data-testid="record-view-work-btn"
                  className={cn('cursor-pointer', isMobile && 'w-full')}
                  onClick={handleViewWork}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('record.viewWork')}
                </Button>
              )}

            </>
          )}

          {shouldShowWxSphReviewPending && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn('inline-flex', isMobile && 'w-full')}>
                    <Button
                      data-testid="record-wx-sph-review-pending-btn"
                      variant="outline"
                      className={cn(
                        'cursor-not-allowed border-primary/30 bg-primary/5 text-primary',
                        isMobile && 'w-full',
                      )}
                      disabled
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {t('record.wxSphReviewPendingShort')}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align={isMobile ? 'center' : 'end'} className="max-w-72">
                  {wxSphReviewPendingTooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {shouldShowContinueUserActionPublish && (
            <Button
              data-testid="record-continue-publish-btn"
              className={cn('cursor-pointer', isMobile && 'w-full')}
              disabled={continuePublishLoading}
              onClick={handleContinueUserActionPublish}
            >
              {continuePublishLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t('record.continuePublish')}
            </Button>
          )}

          {canPublishRecordNow(activeRecord.status, activeRecord.publishTime) ? (
            <Button
              data-testid="record-publish-now-btn"
              className={cn('cursor-pointer', isMobile && 'w-full')}
              disabled={nowPubLoading}
              onClick={handlePublishNow}
            >
              {nowPubLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t('buttons.publishNow')}
            </Button>
          ) : null}

          {!isMobile && shouldShowRetryPublish && (
            <Button
              data-testid="record-retry-btn"
              variant="outline"
              className="cursor-pointer border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
              disabled={retryLoading}
              onClick={handleRetryPublish}
            >
              {retryLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              {t('buttons.retryPublish')}
            </Button>
          )}

          {!isMobile && shouldShowMoreActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-testid="record-more-btn" variant="outline" size="icon" className="cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {shouldShowViewWork && (
                  <DropdownMenuItem onClick={handleCopyWorkLink}>
                    {t('buttons.copyLink')}
                  </DropdownMenuItem>
                )}
                {shouldShowReschedulePublish && (
                  <DropdownMenuItem onClick={handleOpenRescheduleDialog}>
                    <CalendarClock className="h-4 w-4" />
                    {t('buttons.reschedulePublish')}
                  </DropdownMenuItem>
                )}
                {shouldShowCancelPublish && (
                  <DropdownMenuItem
                    className={cancelPublishMenuItemClassName}
                    onClick={handleCancelPublish}
                  >
                    <CircleOff className="h-4 w-4" />
                    {t('buttons.cancelPublish')}
                  </DropdownMenuItem>
                )}
                {shouldShowDeleteRecord && (
                  <DropdownMenuItem
                    className={deleteRecordMenuItemClassName}
                    onClick={handleDeleteRecord}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('buttons.delete')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    )

    return (
      <>
        {isMobile ? (
          // 移动端：全屏 Dialog
          <>
            <div onClick={() => handlePopoverOpenChange(true)}>{TriggerButton}</div>
            <Dialog open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
              <DialogContent
                data-testid="record-detail-dialog"
                className="w-[calc(100%-24px)] max-h-[85vh] max-w-full p-0 flex flex-col overflow-hidden"
                onInteractOutside={(e) => {
                  if (mediaPreviewOpen) {
                    e.preventDefault()
                  }
                }}
              >
                <DialogTitle className="sr-only">{days.format('YYYY-MM-DD HH:mm')}</DialogTitle>
                <RecordContent inDialog />
              </DialogContent>
            </Dialog>
          </>
        ) : (
          // 桌面端：Popover
          <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
            <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
            <PopoverContent
              data-testid="record-detail-popover"
              side="right"
              className="w-[450px] p-0"
              align="start"
              onInteractOutside={(e) => {
                if (mediaPreviewOpen) {
                  e.preventDefault()
                  return
                }
                const target = e.target as HTMLElement
                if (target.closest('[data-cover-preview]')) {
                  e.preventDefault()
                }
              }}
              onPointerDownOutside={(e) => {
                if (mediaPreviewOpen) {
                  e.preventDefault()
                  return
                }
                const target = e.target as HTMLElement
                if (target.closest('[data-cover-preview]')) {
                  e.preventDefault()
                }
              }}
            >
              <RecordContent />
            </PopoverContent>
          </Popover>
        )}

        <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
          <DialogContent className="w-[calc(100%-24px)] max-w-[400px] gap-0 p-0 sm:p-0 overflow-hidden">
            <DialogTitle className="px-4 pt-4 text-base font-semibold">
              {t('record.rescheduleTitle')}
            </DialogTitle>
            <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-info/20 bg-info/10 px-3 py-2 text-xs text-info">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{t('record.dragToRescheduleTip')}</span>
            </div>
            <PublishDatePicker
              inline
              showNowButton={false}
              loading={rescheduleLoading}
              value={reschedulePubTime}
              onValueChange={setReschedulePubTime}
              onClick={handleReschedulePublish}
              submitText={t('buttons.confirm')}
              minLeadMinutes={10}
              isMobile={isMobile}
            />
          </DialogContent>
        </Dialog>

        {/* 媒体预览 */}
        <MediaPreview
          open={mediaPreviewOpen}
          items={mediaPreviewItems}
          initialIndex={mediaPreviewIndex}
          onClose={() => setMediaPreviewOpen(false)}
        />

        <PublishDetailModal
          visible={!!publishDetailTaskId}
          taskId={publishDetailTaskId}
          onClose={() => setPublishDetailTaskId(undefined)}
        />
      </>
    )
  }),
)

export default RecordCore
