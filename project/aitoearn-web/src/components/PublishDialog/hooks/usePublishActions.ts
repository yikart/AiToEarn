/**
 * 发布操作 Hook
 * 处理发布内容的核心逻辑
 */

import type { PlatType } from '@/app/config/platConfig'
import type { PubItem } from '@/components/PublishDialog/publishDialog.type'

import type {
  PlatformPublishTask,
  PluginPlatformType,
  PublishParams as PluginPublishParams,
} from '@/store/plugin'
import { useCallback } from 'react'
import { apiCreatePublish } from '@/api/plat/publish'
import {
  getDays,
  getUtcDays,
} from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { useCalendarTiming } from '@/app/[lng]/accounts/components/CalendarTiming/useCalendarTiming'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { PubType } from '@/app/config/publishConfig'
import { usePublishDialogStorageStore } from '@/components/PublishDialog/usePublishDialogStorageStore'
import { toast } from '@/lib/toast'
import { PlatformTaskStatus, PLUGIN_SUPPORTED_PLATFORMS, usePluginStore } from '@/store/plugin'
import { generateUUID } from '@/utils'

interface UsePublishActionsParams {
  pubListChoosed: PubItem[]
  pubTime?: string
  isMobile: boolean
  suppressAutoPublish?: boolean
  taskIdForPublish?: string
  onPublishConfirmed?: (taskId?: string, publishRecordId?: string, workLink?: string) => void
  onPublishStart?: () => void
  onClose: () => void
  onPubSuccess?: () => void
  setCreateLoading: (loading: boolean) => void
  setDouyinPermalink: (permalink: string) => void
  setDouyinQRCodeVisible: (visible: boolean) => void
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

/**
 * 发布操作 Hook
 */
export function usePublishActions({
  pubListChoosed,
  pubTime,
  isMobile,
  suppressAutoPublish,
  taskIdForPublish,
  onPublishConfirmed,
  onPublishStart,
  onClose,
  onPubSuccess,
  setCreateLoading,
  setDouyinPermalink,
  setDouyinQRCodeVisible,
  setCurrentPublishTaskId,
  setPublishDetailVisible,
  t,
}: UsePublishActionsParams) {
  /**
   * 执行发布
   * 1. 先执行 API 发布（非插件支持平台）
   * 2. 再执行插件发布（插件支持平台）
   * 3. 显示发布详情弹框
   */
  const pubClick = useCallback(async () => {
    setCreateLoading(true)
    onPublishStart?.()

    const publishTime = getUtcDays(pubTime || getDays().add(5, 'second')).format()

    // 分离 API 发布列表和插件发布列表
    const apiPublishItems = pubListChoosed.filter(
      item => !isPluginSupportedPlatform(item.account.type),
    )
    const pluginPublishItems = pubListChoosed.filter(item =>
      isPluginSupportedPlatform(item.account.type),
    )

    // 如果有插件发布项，创建发布任务并显示详情弹框
    let taskId: string | null = null
    // 存储每个发布项对应的平台任务ID，用于后续精确更新
    const platformTaskIdMap = new Map<string, string>()

    if (pluginPublishItems.length > 0) {
      const { addPublishTask } = usePluginStore.getState()

      // 创建平台任务列表，为每个任务生成唯一ID和requestId
      const platformTasks: PlatformPublishTask[] = pluginPublishItems.map((item) => {
        // 使用账号ID生成唯一的平台任务ID
        const platformTaskId = `${item.account.type}-${
          item.account.id
        }-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        // 生成唯一的 requestId，用于插件回调匹配
        const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        // 保存映射关系，用于后续更新（保存 requestId 而非 platformTaskId）
        platformTaskIdMap.set(item.account.id, requestId)

        return {
          id: platformTaskId,
          requestId,
          platform: item.account.type as PluginPlatformType,
          accountId: item.account.id,
          params: {
            platform: item.account.type as PluginPlatformType,
            type: item.params.video?.ossUrl ? 'video' : 'image',
            title: item.params.title || '',
            desc: item.params.des || '',
            topics: item.params.topics || [],
          } as PluginPublishParams,
          status: PlatformTaskStatus.PENDING,
          progress: null,
          result: null,
          startTime: null,
          endTime: null,
          error: null,
        }
      })

      // 添加发布任务
      taskId = addPublishTask({
        title:
          pubListChoosed[0]?.params.title
          || pubListChoosed[0]?.params.des?.slice(0, 20)
          || t('title'),
        description: pubListChoosed[0]?.params.des?.slice(0, 100),
        platformTasks,
      })

      // 设置任务ID并显示弹框
      setCurrentPublishTaskId(taskId)
      setPublishDetailVisible(true)
    }

    // 记录首次 API 发布产生的记录 ID
    let firstPublishRecordId: string | undefined

    // 1. 先执行 API 发布（非插件支持平台）
    for (const item of apiPublishItems) {
      const res = await apiCreatePublish({
        topics: item.params.topics ?? [],
        flowId: generateUUID(),
        type: item.params.video?.cover.ossUrl ? PubType.VIDEO : PubType.ImageText,
        title: item.params.title || '',
        desc: item.params.des,
        accountId: item.account.id,
        accountType: item.account.type,
        userTaskId: taskIdForPublish,
        videoUrl: item.params.video?.ossUrl,
        coverUrl:
          item.params.video?.cover.ossUrl
          || (item.params.images && item.params.images.length > 0
            ? item.params.images[0].ossUrl
            : undefined),
        imgUrlList:
          item.params.images
            ?.map(v => v.ossUrl)
            .filter((url): url is string => url !== undefined) || [],
        publishTime,
        option: item.params.option,
      })

      if (res?.code !== 0) {
        setCreateLoading(false)
        return
      }

      if (!firstPublishRecordId && res?.data?.id) {
        firstPublishRecordId = res.data.id
      }

      // 检查是否是抖音平台，且返回了 permalink
      if (res?.data && typeof res.data === 'object') {
        const resData = res.data as any
        if (
          resData.accountType === 'douyin'
          && resData.permalink
          && typeof resData.permalink === 'string'
        ) {
          if (!isMobile) {
            // PC端：显示二维码弹窗，优先使用 shortLink（标准 HTTPS URL，扫码兼容性更好）
            setDouyinPermalink(`/shortLink?apiLink=${encodeURIComponent(resData.shortLink)}`)
          }
          else {
            // 移动端：显示引导弹窗，用户点击按钮后唤起抖音 App
            setDouyinPermalink(resData.permalink)
          }
          setDouyinQRCodeVisible(true)
        }
      }
    }

    // 2. 再执行插件发布（插件支持平台）
    const hasPluginItems = pluginPublishItems.length > 0
    if (hasPluginItems) {
      let pluginWorkLink: string | undefined

      // 异步执行插件发布，不阻塞主流程
      usePluginStore.getState().executePluginPublish({
        items: pluginPublishItems,
        platformTaskIdMap,
        publishTime,
        userTaskId: taskIdForPublish, // 传递任务ID用于关联发布记录
        onFirstPublishSuccess: (data) => {
          pluginWorkLink = data.shareLink
        },
        onComplete: (pluginPublishRecordId) => {
          // 发布完成后刷新发布记录
          useCalendarTiming.getState().getPubRecord()
          // 插件发布完成后，触发 onPublishConfirmed（仅在有插件项且抑制自动发布时）
          if (suppressAutoPublish && onPublishConfirmed) {
            try {
              onPublishConfirmed(taskIdForPublish, pluginPublishRecordId || firstPublishRecordId, pluginWorkLink)
            }
            catch (e) {
              console.error('onPublishConfirmed callback failed', e)
            }
          }
        },
      })
    }

    // 如果抑制自动发布（来自任务流程），不要自动调用平台 API，但仍需通知外部父组件
    // 有插件项时，由 onComplete 回调触发；无插件项时，立即调用
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
    else {
      const douyinItems = pubListChoosed.filter(item => item.account!.type === 'douyin')
      const otherItems = pubListChoosed.filter(item => item.account!.type !== 'douyin')

      // 非抖音平台的通用提示
      if (otherItems.length > 0) {
        toast.success(
          t('messages.publishSubmitted', {
            platform: otherItems
              .map(item => AccountPlatInfoMap.get(item.account!.type)!.name)
              .join(', '),
          }),
          { key: 'publish_submitted', duration: 3 },
        )
      }

      // 抖音单独提示：需要扫码发布
      if (douyinItems.length > 0) {
        toast.success(
          t('messages.douyinScanPublish'),
          { key: 'douyin_scan_publish', duration: 5 },
        )
      }
    }

    // 关闭发布弹框
    onClose()
    setCreateLoading(false)
    if (onPubSuccess) {
      onPubSuccess()
    }
    usePublishDialogStorageStore.getState().clearPubData()
  }, [
    pubListChoosed,
    pubTime,
    isMobile,
    suppressAutoPublish,
    taskIdForPublish,
    onPublishConfirmed,
    onPublishStart,
    onClose,
    onPubSuccess,
    setCreateLoading,
    setDouyinPermalink,
    setDouyinQRCodeVisible,
    setCurrentPublishTaskId,
    setPublishDetailVisible,
    t,
  ])

  return {
    pubClick,
    isPluginSupportedPlatform,
  }
}
