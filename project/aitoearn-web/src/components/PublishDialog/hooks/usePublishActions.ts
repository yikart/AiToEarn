/**
 * 发布操作 Hook
 * 处理发布内容的核心逻辑
 */

import type { ChannelPublishUserActionVo } from '@/api/channels/channel.types'
import type { PubItem } from '@/components/PublishDialog/publishDialog.type'
import type {
  PlatformPublishMode,
  PlatformPublishTask,
  PluginPlatformType,
  PublishParams as PluginPublishParams,
  UnifiedPublishParams,
} from '@/store/plugin'
import { useCallback } from 'react'
import { createChannelPublishFlowApi, getChannelPublishUserActionApi } from '@/api/channels/channel.api'
import { getPublishRecordDetailById } from '@/api/platforms/publish.api'
import { PublishStatus } from '@/api/platforms/publish.constants'
import {
  getDays,
  getUtcDays,
} from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { AccountStatus } from '@/app/config/accountConfig'
import { PlatType } from '@/app/config/platConfig'
import {
  buildChannelPublishFlowParams,
  getPublishRecordIdFromFlow,
  isPublishTitleSupported,
} from '@/components/PublishDialog/PublishDialog.util'
import { usePublishDialogStorageStore } from '@/components/PublishDialog/usePublishDialogStorageStore'
import { getPlatformInfoSync, isPlatformDisabledSync, isPlatformEnabledSync } from '@/store/platformMetadata'
import { PlatformTaskStatus, PLUGIN_SUPPORTED_PLATFORMS, usePluginStore } from '@/store/plugin'
import { sleep } from '@/utils/common'
import { toast } from '@/utils/ui/toast'

const DOUYIN_RECORD_POLL_INTERVAL_MS = 5000
const DOUYIN_RECORD_POLL_MAX_COUNT = 36
const douyinRecordPollingStatuses: readonly number[] = [
  PublishStatus.UNPUBLISH,
  PublishStatus.PUB_LOADING,
  PublishStatus.QUEUED,
]
const douyinRecordFailedStatuses: readonly number[] = [
  PublishStatus.FAIL,
  PublishStatus.UPDATED_FAILED,
  PublishStatus.CANCELED,
]

interface UsePublishActionsParams {
  pubListChoosed: PubItem[]
  pubTime?: string
  suppressAutoPublish?: boolean
  taskIdForPublish?: string
  materialGroupIdForPublish?: string
  materialIdForPublish?: string
  onPublishConfirmed?: (taskId?: string, publishRecordId?: string) => void
  onPublishStart?: () => void
  onClose: () => void
  onPubSuccess?: () => void
  setCreateLoading: (loading: boolean) => void
  setCurrentPublishTaskId: (taskId: string | undefined) => void
  setPublishDetailVisible: (visible: boolean) => void
  t: (key: string, params?: Record<string, string>) => string
}

/**
 * 检查平台是否由插件支持
 */
export function isPluginSupportedPlatform(platType: PlatType | string): boolean {
  return PLUGIN_SUPPORTED_PLATFORMS.includes(platType as PluginPlatformType)
}

function getPlatformTaskId(item: PubItem, publishMode: PlatformPublishMode) {
  return `${publishMode}-${item.account.type}-${item.account.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function buildTaskPublishParams(item: PubItem): UnifiedPublishParams {
  const params: UnifiedPublishParams = {
    platform: item.account.type as PlatType,
    accountId: item.account.id,
    type: item.params.video ? 'video' : 'image',
    desc: item.params.des || '',
    topics: item.params.topics || [],
  }

  if (isPublishTitleSupported(item.account.type))
    params.title = item.params.title || ''

  return params
}

function buildUnifiedPlatformTask(item: PubItem, publishMode: PlatformPublishMode): PlatformPublishTask {
  return {
    id: getPlatformTaskId(item, publishMode),
    platform: item.account.type as PlatType,
    accountId: item.account.id,
    publishMode,
    params: buildTaskPublishParams(item),
    status: PlatformTaskStatus.PENDING,
    progress: null,
    result: null,
    startTime: null,
    endTime: null,
    error: null,
  }
}

function hasDouyinUserAction(
  data: ChannelPublishUserActionVo | null | undefined,
): data is ChannelPublishUserActionVo & { schemeUrl: string, shortLink: string } {
  return !!data?.schemeUrl && !!data.shortLink
}

function normalizePublishStatus(status: string | number | undefined) {
  const normalized = Number(status)
  return Number.isFinite(normalized) ? normalized : undefined
}

function isDouyinUserActionReadyStatus(status: string | number | undefined) {
  return normalizePublishStatus(status) === PublishStatus.WAITING_FOR_USER_ACTION
}

function shouldPollDouyinRecord(status: string | number | undefined) {
  const normalized = normalizePublishStatus(status)
  return normalized !== undefined && douyinRecordPollingStatuses.includes(normalized)
}

function isDouyinRecordFailedStatus(status: string | number | undefined) {
  const normalized = normalizePublishStatus(status)
  return normalized !== undefined && douyinRecordFailedStatuses.includes(normalized)
}

async function pollDouyinRecordUntilUserActionReady(publishRecordId: string) {
  let latestRes: Awaited<ReturnType<typeof getPublishRecordDetailById>> | null = null

  for (let pollIndex = 0; pollIndex < DOUYIN_RECORD_POLL_MAX_COUNT; pollIndex++) {
    if (pollIndex > 0)
      await sleep(DOUYIN_RECORD_POLL_INTERVAL_MS)

    latestRes = await getPublishRecordDetailById(publishRecordId)
    const record = latestRes?.data
    if (!record)
      continue

    if (isDouyinUserActionReadyStatus(record.status))
      return latestRes

    if (isDouyinRecordFailedStatus(record.status) || !shouldPollDouyinRecord(record.status))
      return latestRes
  }

  return latestRes
}

/**
 * 发布操作 Hook
 */
export function usePublishActions({
  pubListChoosed,
  pubTime,
  suppressAutoPublish,
  taskIdForPublish,
  materialGroupIdForPublish,
  materialIdForPublish,
  onPublishConfirmed,
  onPublishStart,
  onClose,
  onPubSuccess,
  setCreateLoading,
  setCurrentPublishTaskId,
  setPublishDetailVisible,
  t,
}: UsePublishActionsParams) {
  /**
   * 执行发布
   * 1. API 发布与插件发布共用一个详情任务
   * 2. 插件发布立即启动，不等待 API 发布
   * 3. API 发布后台执行，只更新自己的平台任务状态
   */
  const pubClick = useCallback(async () => {
    const offlineItem = pubListChoosed.find(item => item.account.status === AccountStatus.DISABLE)
    if (offlineItem) {
      toast.error(t('tips.accountOffline'))
      return
    }

    const disabledItem = pubListChoosed.find(item => isPlatformDisabledSync(item.account.type))
    if (disabledItem) {
      toast.error(
        t('tips.platformComingSoon', {
          platform: getPlatformInfoSync(disabledItem.account.type)?.name || disabledItem.account.type,
        }),
      )
      return
    }

    const restrictedItem = pubListChoosed.find(item => !isPlatformEnabledSync(item.account.type))
    if (restrictedItem) {
      toast.error(
        t('tips.regionRestricted', {
          platform: getPlatformInfoSync(restrictedItem.account.type)?.name || restrictedItem.account.type,
        }),
      )
      return
    }

    setCreateLoading(true)
    onPublishStart?.()

    const publishTime = getUtcDays(pubTime || getDays().add(5, 'second')).format()

    // 分离发布任务和自动发布列表
    const apiPublishItems = pubListChoosed.filter(
      item => !isPluginSupportedPlatform(item.account.type),
    )
    const pluginPublishItems = pubListChoosed.filter(item =>
      isPluginSupportedPlatform(item.account.type),
    )

    const pluginPlatformTasks: PlatformPublishTask[] = []
    const apiPlatformTaskMap = new Map<string, PlatformPublishTask>()
    const platformTaskIdMap = new Map<string, string>()

    pluginPublishItems.forEach((item) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      platformTaskIdMap.set(item.account.id, requestId)

      const pluginPublishParams: PluginPublishParams = {
        platform: item.account.type as PluginPlatformType,
        type: item.params.video ? 'video' : 'image',
        desc: item.params.des || '',
        topics: item.params.topics || [],
      }
      if (isPublishTitleSupported(item.account.type))
        pluginPublishParams.title = item.params.title || ''

      pluginPlatformTasks.push({
        ...buildUnifiedPlatformTask(item, 'auto'),
        requestId,
        params: pluginPublishParams,
      })
    })

    apiPublishItems.forEach((item) => {
      const publishMode: PlatformPublishMode = item.account.type === PlatType.Douyin ? 'user_action' : 'task'
      apiPlatformTaskMap.set(item.account.id, {
        ...buildUnifiedPlatformTask(item, publishMode),
        status: PlatformTaskStatus.PUBLISHING,
        startTime: Date.now(),
      })
    })

    const { addPublishTask, updatePlatformTask } = usePluginStore.getState()
    const taskTitle = pubListChoosed[0]?.params.title
      || pubListChoosed[0]?.params.des?.slice(0, 20)
      || t('title')
    const taskDescription = pubListChoosed[0]?.params.des?.slice(0, 100)
    const platformTasks = [
      ...pluginPlatformTasks,
      ...Array.from(apiPlatformTaskMap.values()),
    ]

    if (platformTasks.length === 0) {
      setCreateLoading(false)
      return
    }

    const taskId = addPublishTask({
      title: taskTitle,
      description: taskDescription,
      platformTasks,
    })

    setCurrentPublishTaskId(taskId)
    setPublishDetailVisible(true)
    onClose()

    const updateApiTask = (item: PubItem, updates: Partial<PlatformPublishTask>) => {
      const platformTask = apiPlatformTaskMap.get(item.account.id)
      if (!platformTask)
        return

      updatePlatformTask(taskId, platformTask.id, updates)
    }

    const updateDouyinUserActionError = (item: PubItem, publishRecordId: string, message?: string) => {
      const errorMessage = message || t('messages.userActionFetchFailed')
      updateApiTask(item, {
        status: PlatformTaskStatus.ERROR,
        publishRecordId,
        error: errorMessage,
        endTime: Date.now(),
        result: {
          success: false,
          failReason: errorMessage,
        },
      })
    }

    const fetchAndUpdateDouyinUserAction = async (item: PubItem, publishRecordId: string) => {
      try {
        const recordRes = await pollDouyinRecordUntilUserActionReady(publishRecordId)
        const record = recordRes?.data
        if (!record || !isDouyinUserActionReadyStatus(record.status)) {
          updateDouyinUserActionError(item, publishRecordId, record?.errorMsg || recordRes?.message)
          return
        }

        await useCalendarTiming.getState().refreshPubRecordDetail(publishRecordId)

        const userActionRes = await getChannelPublishUserActionApi(publishRecordId)
        if (userActionRes?.code !== 0 || !hasDouyinUserAction(userActionRes.data)) {
          updateDouyinUserActionError(item, publishRecordId, userActionRes?.message)
          return
        }

        const userActionPublishRecordId = userActionRes.data.recordId || publishRecordId
        updateApiTask(item, {
          status: PlatformTaskStatus.PENDING,
          publishRecordId: userActionPublishRecordId,
          userAction: {
            schemeUrl: userActionRes.data.schemeUrl,
            shortLink: userActionRes.data.shortLink,
            expiresAt: userActionRes.data.expiresAt,
          },
          progress: null,
          result: null,
          endTime: Date.now(),
        })
      }
      catch {
        updateDouyinUserActionError(item, publishRecordId)
      }
    }

    let firstPublishRecordId: string | undefined
    const hasPluginItems = pluginPublishItems.length > 0

    // 插件发布与 API 发布分线执行：插件发布不等待 API 发布任务创建结果
    if (hasPluginItems) {
      void usePluginStore.getState().executePluginPublish({
        items: pluginPublishItems,
        platformTaskIdMap,
        publishTime,
        userTaskId: taskIdForPublish, // 传递任务ID用于关联发布记录
        ...(materialGroupIdForPublish ? { materialGroupId: materialGroupIdForPublish } : {}),
        ...(materialIdForPublish ? { materialId: materialIdForPublish } : {}),
        skipAddTask: true,
        onComplete: (pluginPublishRecordId) => {
          useCalendarTiming.getState().getPubRecord()
          if (suppressAutoPublish && onPublishConfirmed) {
            try {
              onPublishConfirmed(taskIdForPublish, pluginPublishRecordId || firstPublishRecordId)
            }
            catch (e) {
              console.error('onPublishConfirmed callback failed', e)
            }
          }
        },
      })
    }

    const executeApiPublish = async () => {
      if (apiPublishItems.length === 0)
        return true

      const flowParams = buildChannelPublishFlowParams(apiPublishItems, {
        publishAt: publishTime,
        userTaskId: taskIdForPublish,
        materialGroupId: materialGroupIdForPublish,
        materialId: materialIdForPublish,
        source: 'web',
      })

      if (!flowParams) {
        apiPublishItems.forEach(item => updateApiTask(item, {
          status: PlatformTaskStatus.ERROR,
          error: t('messages.publishFailed'),
          endTime: Date.now(),
          result: {
            success: false,
            failReason: t('messages.publishFailed'),
          },
        }))
        return false
      }

      let res: Awaited<ReturnType<typeof createChannelPublishFlowApi>>
      try {
        res = await createChannelPublishFlowApi(flowParams)
      }
      catch {
        apiPublishItems.forEach(item => updateApiTask(item, {
          status: PlatformTaskStatus.ERROR,
          error: t('messages.publishFailed'),
          endTime: Date.now(),
          result: {
            success: false,
            failReason: t('messages.publishFailed'),
          },
        }))
        return false
      }

      if (res?.code !== 0) {
        apiPublishItems.forEach(item => updateApiTask(item, {
          status: PlatformTaskStatus.ERROR,
          error: res?.message || t('messages.publishFailed'),
          endTime: Date.now(),
          result: {
            success: false,
            failReason: res?.message || t('messages.publishFailed'),
          },
        }))
        return false
      }

      firstPublishRecordId = getPublishRecordIdFromFlow(res.data)

      apiPublishItems.forEach((item) => {
        const publishRecordId = getPublishRecordIdFromFlow(res.data, item.account.id)
        if (!publishRecordId) {
          updateApiTask(item, {
            status: PlatformTaskStatus.ERROR,
            error: t('messages.publishFailed'),
            endTime: Date.now(),
            result: {
              success: false,
              failReason: t('messages.publishFailed'),
            },
          })
          return
        }

        if (item.account.type === PlatType.Douyin) {
          updateApiTask(item, { publishRecordId })
          void fetchAndUpdateDouyinUserAction(item, publishRecordId)
          return
        }

        updateApiTask(item, {
          status: PlatformTaskStatus.COMPLETED,
          publishRecordId,
          progress: {
            stage: 'complete',
            progress: 100,
            message: t('messages.publishTaskCreated'),
            timestamp: Date.now(),
          },
          result: {
            success: true,
            workId: publishRecordId,
          },
          endTime: Date.now(),
        })
      })

      return true
    }

    const apiPublishPromise = executeApiPublish()
    if (!hasPluginItems) {
      const apiPublishSuccess = await apiPublishPromise
      if (!apiPublishSuccess) {
        setCreateLoading(false)
        return
      }
    }
    else {
      void apiPublishPromise
    }

    if (suppressAutoPublish) {
      if (!hasPluginItems && onPublishConfirmed) {
        try {
          onPublishConfirmed(taskIdForPublish, firstPublishRecordId)
        }
        catch (e) {
          console.error('onPublishConfirmed callback failed', e)
        }
      }
    }

    setCreateLoading(false)
    if (onPubSuccess) {
      onPubSuccess()
    }
    usePublishDialogStorageStore.getState().clearPubData()
  }, [
    pubListChoosed,
    pubTime,
    suppressAutoPublish,
    taskIdForPublish,
    materialGroupIdForPublish,
    materialIdForPublish,
    onPublishConfirmed,
    onPublishStart,
    onClose,
    onPubSuccess,
    setCreateLoading,
    setCurrentPublishTaskId,
    setPublishDetailVisible,
    t,
  ])

  return {
    pubClick,
    isPluginSupportedPlatform,
  }
}
