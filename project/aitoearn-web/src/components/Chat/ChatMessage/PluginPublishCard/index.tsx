/**
 * PluginPublishCard - 插件平台自动发布倒计时卡片
 * 功能：在 Chat 消息下方内联展示，支持实时 SSE 消息自动倒计时发布，历史消息静态展示
 * 状态机：COUNTDOWN → PUBLISHING → SUCCESS / ERROR，IDLE（历史消息）
 */

'use client'

import type { PlatType } from '@/app/config/platConfig'
import type { IActionCard } from '@/store/agent/agent.types'
import type { PlatformProgressEvent } from '@/store/plugin/store'
import type { PluginPlatformType } from '@/store/plugin/types/baseTypes'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
  Timer,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { AccountStatus } from '@/app/config/accountConfig'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import { PluginModal } from '@/components/Plugin'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { buildPluginPublishItem } from '@/store/agent/handlers/action.handlers'
import { usePluginStore } from '@/store/plugin'
import { PluginStatus } from '@/store/plugin/types/baseTypes'
import { getOssUrl } from '@/utils/oss'
import { getActionKey, usePluginPublishCache } from './usePluginPublishCache'

/** 发布状态 */
type PublishState
  = | 'IDLE'
    | 'COUNTDOWN'
    | 'PUBLISHING'
    | 'SUCCESS'
    | 'ERROR'
    | 'PLUGIN_NOT_INSTALLED' // 未安装插件
    | 'PLATFORM_NOT_LOGGED' // 平台未登录

export interface IPluginPublishCardProps {
  /** Action 数据 */
  action: IActionCard
  /** 自定义类名 */
  className?: string
}

/**
 * PluginPublishCard - 插件平台发布卡片组件
 */
const PluginPublishCard = memo(({ action, className }: IPluginPublishCardProps) => {
  const { t } = useTransClient('chat')

  // 获取平台信息
  const platInfo = action.platform ? AccountPlatInfoMap.get(action.platform as PlatType) : null
  const platformName = platInfo?.name || action.platform || 'Platform'

  // 获取封面图（从 medias 中取第一个，视频优先用缩略图）
  const firstMedia = action.medias?.[0]
  const coverImage = firstMedia?.thumbUrl || firstMedia?.coverUrl || firstMedia?.url

  // 缓存 key 及已有记录
  const actionKey = getActionKey(action)
  const cachedRecord = usePluginPublishCache.getState().getRecord(actionKey)

  // 状态机：缓存优先 > _isRealtime 判断
  const [state, setState] = useState<PublishState>(() => {
    if (cachedRecord?.state === 'SUCCESS')
      return 'SUCCESS'
    return action._isRealtime ? 'COUNTDOWN' : 'IDLE'
  })
  const [countdown, setCountdown] = useState(3)
  const [progress, setProgress] = useState<PlatformProgressEvent | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [shareLink, setShareLink] = useState(cachedRecord?.shareLink || '')
  // 插件弹框状态
  const [showPluginModal, setShowPluginModal] = useState(false)

  // 防止重复触发发布（React StrictMode / 重渲染）
  const hasTriggeredRef = useRef(false)
  // 倒计时 interval 引用
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /**
   * 执行发布流程
   */
  const executePublish = useCallback(async () => {
    // 防重复
    if (hasTriggeredRef.current)
      return
    hasTriggeredRef.current = true

    const pluginStatus = usePluginStore.getState().status
    const platformAccounts = usePluginStore.getState().platformAccounts
    const platform = action.platform as PluginPlatformType

    // 1. 检查插件是否安装
    if (pluginStatus === PluginStatus.NOT_INSTALLED || pluginStatus === PluginStatus.UNKNOWN) {
      setState('PLUGIN_NOT_INSTALLED')
      hasTriggeredRef.current = false
      return
    }

    // 2. 检查插件是否就绪
    if (pluginStatus !== PluginStatus.READY) {
      setState('ERROR')
      setErrorMsg(t('pluginPublish.pluginNotReady'))
      hasTriggeredRef.current = false
      return
    }

    // 3. 检查平台是否已登录（platformAccounts 中是否有该平台账号）
    const platformAccount = platformAccounts[platform]
    if (!platformAccount) {
      setState('PLATFORM_NOT_LOGGED')
      hasTriggeredRef.current = false
      return
    }

    setState('PUBLISHING')

    // 4. 检查账号是否已同步到数据库
    const accountList = useAccountStore.getState().accountList
    const hasOnlineAccount = accountList.some(
      acc =>
        acc.type === platform
        && acc.uid === platformAccount.uid
        && acc.status === AccountStatus.USABLE,
    )

    // 如果未同步，自动同步账号
    if (!hasOnlineAccount) {
      await usePluginStore.getState().syncAccountToDatabase(platform)
      // 重新获取账号列表
      await useAccountStore.getState().getAccountList()
    }

    // 获取目标账号
    const accountGroupList = useAccountStore.getState().accountGroupList
    const allAccounts = accountGroupList.reduce<any[]>((acc, group) => {
      return [...acc, ...group.children]
    }, [])

    let targetAccounts: any[] = []
    if (action.accountId) {
      const targetAccount = allAccounts.find(account => account.id === action.accountId)
      if (targetAccount) {
        targetAccounts = [targetAccount]
      }
    }
    else {
      targetAccounts = allAccounts.filter(account => account.type === action.platform)
    }

    if (targetAccounts.length === 0) {
      setState('ERROR')
      setErrorMsg(t('pluginPublish.noAccountFound'))
      hasTriggeredRef.current = false
      return
    }

    // 构建发布项
    const allPluginPublishItems = targetAccounts.map((account) => {
      return buildPluginPublishItem(
        {
          type: 'fullContent',
          action: 'navigateToPublish',
          platform: action.platform,
          accountId: action.accountId,
          title: action.title,
          description: action.description,
          medias: action.medias,
          tags: action.tags,
        },
        account,
      )
    })

    const platformTaskIdMap = new Map<string, string>()
    targetAccounts.forEach((account) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      platformTaskIdMap.set(account.id, requestId)
    })

    // 调用插件发布
    usePluginStore.getState().executePluginPublish({
      items: allPluginPublishItems,
      platformTaskIdMap,
      skipAddTask: true, // 跳过添加任务，不触发 PublishDetailModal 弹框
      onProgress: (event: PlatformProgressEvent) => {
        setProgress(event)

        if (event.stage === 'complete') {
          setState('SUCCESS')
          // 提取 shareLink
          const link = event.data?.shareLink || ''
          if (link)
            setShareLink(link)
          // 持久化到缓存
          usePluginPublishCache.getState().setRecord(actionKey, {
            state: 'SUCCESS',
            shareLink: link,
            timestamp: Date.now(),
          })
        }
        else if (event.stage === 'error') {
          setState('ERROR')
          setErrorMsg(event.message || t('pluginPublish.publishFailed'))
          hasTriggeredRef.current = false
        }
      },
      onComplete: () => {
        // 如果还在 PUBLISHING 状态，说明可能没有收到 complete/error 进度
        setState((prev) => {
          if (prev === 'PUBLISHING') {
            // 兜底写入缓存
            usePluginPublishCache.getState().setRecord(actionKey, {
              state: 'SUCCESS',
              shareLink: '',
              timestamp: Date.now(),
            })
            return 'SUCCESS'
          }
          return prev
        })
      },
    })
  }, [action, actionKey, t])

  /**
   * 倒计时逻辑
   */
  useEffect(() => {
    if (state !== 'COUNTDOWN')
      return

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // 倒计时结束，触发发布
          if (countdownRef.current) {
            clearInterval(countdownRef.current)
            countdownRef.current = null
          }
          executePublish()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
  }, [state, executePublish])

  /**
   * beforeunload 保护 - 发布中阻止关闭浏览器
   */
  useEffect(() => {
    if (state !== 'PUBLISHING')
      return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      return ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [state])

  /**
   * 处理"立即发布"按钮
   */
  const handlePublishNow = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    executePublish()
  }, [executePublish])

  /**
   * 处理"取消"按钮
   */
  const handleCancel = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setState('IDLE')
    hasTriggeredRef.current = true // 取消后不再自动发布
  }, [])

  /**
   * 处理"去发布"/"重新发布"按钮
   */
  const handleManualPublish = useCallback(() => {
    hasTriggeredRef.current = false
    executePublish()
  }, [executePublish])

  /**
   * 处理"重试"按钮（用于插件未安装/平台未登录场景）
   */
  const handleRetry = useCallback(() => {
    hasTriggeredRef.current = false
    // 重新检查插件状态
    usePluginStore.getState().checkPlugin()
    usePluginStore.getState().checkPermission().then(() => {
      executePublish()
    })
  }, [executePublish])

  /**
   * 获取进度阶段文案
   */
  const getStageText = useCallback(
    (stage?: string) => {
      switch (stage) {
        case 'download':
          return t('pluginPublish.stage.download')
        case 'upload':
          return t('pluginPublish.stage.upload')
        case 'publish':
          return t('pluginPublish.stage.publish')
        case 'complete':
          return t('pluginPublish.stage.complete')
        default:
          return t('pluginPublish.publishing', { platform: platformName })
      }
    },
    [t, platformName],
  )

  // ============ 渲染各状态 UI ============

  // PLUGIN_NOT_INSTALLED 状态 - 未安装插件
  if (state === 'PLUGIN_NOT_INSTALLED') {
    return (
      <div
        className={cn(
          'flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border bg-muted/30',
          'w-full sm:max-w-md',
          className,
        )}
      >
        {/* 左侧：封面图 */}
        {coverImage && (
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted shrink-0">
            <Image src={getOssUrl(coverImage)} alt="Cover" fill className="object-cover" />
          </div>
        )}

        {/* 右侧：内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部：平台图标 */}
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <div className="flex items-center gap-1.5">
              {platInfo && (
                <Image
                  src={platInfo.icon}
                  alt={platInfo.name}
                  width={16}
                  height={16}
                  className="rounded"
                />
              )}
              <span className="text-xs font-medium">{platformName}</span>
            </div>
          </div>

          {/* 标题 */}
          <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-1 mb-0.5 sm:mb-1">
            {action.title || t('publishDetail.noTitle')}
          </h4>

          {/* 状态区 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {t('pluginPublish.pluginNotInstalled')}
              <button
                onClick={() => setShowPluginModal(true)}
                className="text-primary underline ml-1 cursor-pointer"
              >
                {t('pluginPublish.installPlugin')}
              </button>
            </span>
            <Button
              onClick={handleRetry}
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs cursor-pointer w-fit"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {t('pluginPublish.retry')}
            </Button>
          </div>
        </div>

        <PluginModal visible={showPluginModal} onClose={() => setShowPluginModal(false)} />
      </div>
    )
  }

  // PLATFORM_NOT_LOGGED 状态 - 平台未登录
  if (state === 'PLATFORM_NOT_LOGGED') {
    return (
      <div
        className={cn(
          'flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border bg-muted/30',
          'w-full sm:max-w-md',
          className,
        )}
      >
        {/* 左侧：封面图 */}
        {coverImage && (
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted shrink-0">
            <Image src={getOssUrl(coverImage)} alt="Cover" fill className="object-cover" />
          </div>
        )}

        {/* 右侧：内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部：平台图标 */}
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <div className="flex items-center gap-1.5">
              {platInfo && (
                <Image
                  src={platInfo.icon}
                  alt={platInfo.name}
                  width={16}
                  height={16}
                  className="rounded"
                />
              )}
              <span className="text-xs font-medium">{platformName}</span>
            </div>
          </div>

          {/* 标题 */}
          <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-1 mb-0.5 sm:mb-1">
            {action.title || t('publishDetail.noTitle')}
          </h4>

          {/* 状态区 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {t('pluginPublish.platformNotLogged', { platform: platformName })}
              <button
                onClick={() => setShowPluginModal(true)}
                className="text-primary underline ml-1 cursor-pointer"
              >
                {t('pluginPublish.goLogin')}
              </button>
            </span>
            <Button
              onClick={handleRetry}
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs cursor-pointer w-fit"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {t('pluginPublish.retry')}
            </Button>
          </div>
        </div>

        <PluginModal visible={showPluginModal} onClose={() => setShowPluginModal(false)} />
      </div>
    )
  }

  // COUNTDOWN 状态 - 简洁卡片 + 倒计时
  if (state === 'COUNTDOWN') {
    return (
      <div
        className={cn(
          'flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border bg-muted/30',
          'w-full sm:max-w-md',
          className,
        )}
      >
        {/* 左侧：封面图 */}
        {coverImage && (
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted shrink-0">
            <Image src={getOssUrl(coverImage)} alt="Cover" fill className="object-cover" />
          </div>
        )}

        {/* 右侧：内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部：平台图标 */}
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <div className="flex items-center gap-1.5">
              {platInfo && (
                <Image
                  src={platInfo.icon}
                  alt={platInfo.name}
                  width={16}
                  height={16}
                  className="rounded"
                />
              )}
              <span className="text-xs font-medium">{platformName}</span>
            </div>
          </div>

          {/* 标题 */}
          <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-1 mb-0.5 sm:mb-1">
            {action.title || t('publishDetail.noTitle')}
          </h4>

          {/* 状态区：倒计时标签 + 按钮 */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {/* 状态标签 */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700 w-fit">
              <Timer className="w-3 h-3" />
              {t('pluginPublish.autoPublishIn', { seconds: countdown, platform: '' })
                .replace(platformName, '')
                .trim()}
            </span>

            {/* 按钮区域 */}
            <div className="flex items-center gap-1.5">
              <Button
                onClick={handlePublishNow}
                className="h-6 px-2 text-xs cursor-pointer"
                variant="default"
                size="sm"
              >
                <Send className="w-3 h-3 mr-1" />
                {t('pluginPublish.publishNow')}
              </Button>
              <Button
                onClick={handleCancel}
                className="h-6 px-2 text-xs cursor-pointer"
                variant="ghost"
                size="sm"
              >
                <X className="w-3 h-3 mr-1" />
                {t('pluginPublish.cancel')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // PUBLISHING 状态 - 简洁卡片 + 进度
  if (state === 'PUBLISHING') {
    const progressPercent = progress?.progress ?? 0
    const stageText = getStageText(progress?.stage)

    return (
      <div
        className={cn(
          'flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border bg-muted/30',
          'w-full sm:max-w-md',
          className,
        )}
      >
        {/* 左侧：封面图 */}
        {coverImage && (
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted shrink-0">
            <Image src={getOssUrl(coverImage)} alt="Cover" fill className="object-cover" />
          </div>
        )}

        {/* 右侧：内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部：平台图标 */}
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <div className="flex items-center gap-1.5">
              {platInfo && (
                <Image
                  src={platInfo.icon}
                  alt={platInfo.name}
                  width={16}
                  height={16}
                  className="rounded"
                />
              )}
              <span className="text-xs font-medium">{platformName}</span>
            </div>
          </div>

          {/* 标题 */}
          <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-1 mb-0.5 sm:mb-1">
            {action.title || t('publishDetail.noTitle')}
          </h4>

          {/* 状态区 */}
          <div className="flex flex-col gap-1.5">
            {/* 状态标签 */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700">
                <Loader2 className="w-3 h-3 animate-spin" />
                {stageText}
              </span>
              {progressPercent > 0 && (
                <span className="text-xs text-muted-foreground">
                  {progressPercent}
                  %
                </span>
              )}
            </div>

            {/* 进度条 */}
            <div className="w-full bg-muted rounded-full h-1">
              <div
                className="bg-cyan-500 dark:bg-cyan-400 h-1 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(progressPercent, 5)}%` }}
              />
            </div>

            {/* 警告提示 */}
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {t('pluginPublish.doNotCloseBrowser')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // SUCCESS 状态 - 简洁卡片
  if (state === 'SUCCESS') {
    return (
      <div
        className={cn(
          'flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border bg-muted/30',
          'w-full sm:max-w-md',
          className,
        )}
      >
        {/* 左侧：封面图 */}
        {coverImage && (
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted shrink-0">
            <Image src={getOssUrl(coverImage)} alt="Cover" fill className="object-cover" />
          </div>
        )}

        {/* 右侧：内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部：平台图标 */}
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <div className="flex items-center gap-1.5">
              {platInfo && (
                <Image
                  src={platInfo.icon}
                  alt={platInfo.name}
                  width={16}
                  height={16}
                  className="rounded"
                />
              )}
              <span className="text-xs font-medium">{platformName}</span>
            </div>
          </div>

          {/* 标题 */}
          <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-1 mb-0.5 sm:mb-1">
            {action.title || t('publishDetail.noTitle')}
          </h4>

          {/* 状态区 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
            {/* 状态标签 */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700 w-fit">
              <CheckCircle2 className="w-3 h-3" />
              {t('pluginPublish.publishSuccess')}
            </span>

            {/* 查看作品按钮 */}
            {shareLink && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs cursor-pointer w-fit"
                onClick={() => window.open(shareLink, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                {t('pluginPublish.viewWork')}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ERROR 状态 - 简洁卡片 + 重试按钮
  if (state === 'ERROR') {
    return (
      <div
        className={cn(
          'flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border bg-muted/30',
          'w-full sm:max-w-md',
          className,
        )}
      >
        {/* 左侧：封面图 */}
        {coverImage && (
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted shrink-0">
            <Image src={getOssUrl(coverImage)} alt="Cover" fill className="object-cover" />
          </div>
        )}

        {/* 右侧：内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部：平台图标 */}
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <div className="flex items-center gap-1.5">
              {platInfo && (
                <Image
                  src={platInfo.icon}
                  alt={platInfo.name}
                  width={16}
                  height={16}
                  className="rounded"
                />
              )}
              <span className="text-xs font-medium">{platformName}</span>
            </div>
          </div>

          {/* 标题 */}
          <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-1 mb-0.5 sm:mb-1">
            {action.title || t('publishDetail.noTitle')}
          </h4>

          {/* 状态区 */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            {/* 状态标签 */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive w-fit">
              <AlertCircle className="w-3 h-3" />
              {t('pluginPublish.publishFailed')}
            </span>

            {/* 错误信息 */}
            {errorMsg && <p className="text-xs text-destructive line-clamp-1">{errorMsg}</p>}

            {/* 重新发布按钮 */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs cursor-pointer w-fit"
              onClick={handleManualPublish}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {t('pluginPublish.retryPublish')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // IDLE 状态 - 简洁卡片 + 去发布按钮
  return (
    <div
      className={cn(
        'flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border bg-muted/30',
        'w-full sm:max-w-md',
        className,
      )}
    >
      {/* 左侧：封面图 */}
      {coverImage && (
        <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted shrink-0">
          <Image src={getOssUrl(coverImage)} alt="Cover" fill className="object-cover" />
        </div>
      )}

      {/* 右侧：内容 */}
      <div className="flex-1 min-w-0">
        {/* 头部：平台图标 */}
        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
          <div className="flex items-center gap-1.5">
            {platInfo && (
              <Image
                src={platInfo.icon}
                alt={platInfo.name}
                width={16}
                height={16}
                className="rounded"
              />
            )}
            <span className="text-xs font-medium">{platformName}</span>
          </div>
        </div>

        {/* 标题 */}
        <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-1 mb-0.5 sm:mb-1">
          {action.title || t('publishDetail.noTitle')}
        </h4>

        {/* 描述 */}
        {action.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2 mb-1 sm:mb-1.5">
            {action.description}
          </p>
        )}

        {/* 状态区 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
          {/* 状态标签 */}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700 w-fit">
            <Clock className="w-3 h-3" />
            {t('publishDetail.unpublished')}
          </span>

          {/* 去发布按钮 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs cursor-pointer w-fit"
            onClick={handleManualPublish}
          >
            <Send className="w-3 h-3 mr-1" />
            {t('pluginPublish.goPublish')}
          </Button>
        </div>
      </div>
    </div>
  )
})

PluginPublishCard.displayName = 'PluginPublishCard'

export default PluginPublishCard
