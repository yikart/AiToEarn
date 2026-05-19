/**
 * AccountsTab - 平台账号 Tab 组件
 * 显示插件支持的平台账号列表及其状态
 */

'use client'

import type { PluginPlatformType } from '@/store/plugin/types/baseTypes'
import type { PlatAccountInfo } from '@/store/plugin/types/plat.type'
import { BookOpen, CheckCircle, CircleHelp, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { AccountPlatInfoMap, PlatType } from '@/app/config/platConfig'
import AvatarPlat from '@/components/AvatarPlat'
import { useChannelManagerStore } from '@/components/ChannelManager'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { getXhsLoginStatus, isPluginPlatformAccountReady, usePluginStore } from '@/store/plugin'
import { PLUGIN_SUPPORTED_PLATFORMS } from '@/store/plugin/types/baseTypes'

interface AccountsTabProps {
  /** 需要高亮的平台 */
  highlightPlatform?: string | null
}

type PlatformLoginTarget = 'home' | 'creator'
type XhsLoginStage = 'none' | 'homeOnly' | 'creatorOnly' | 'ready'

const XHS_CREATOR_LOGIN_URL = '//creator.xiaohongshu.com/?source=official'
const AUTH_POLLING_INTERVAL = 2000
const AUTH_POLLING_MAX_ATTEMPTS = 60
const AUTH_POLLING_PLATFORMS: readonly PluginPlatformType[] = [PlatType.Xhs, PlatType.WxSph]

function shouldStartAuthPolling(platform: PluginPlatformType) {
  return AUTH_POLLING_PLATFORMS.includes(platform)
}

/**
 * 获取平台显示名称
 */
function getPlatformName(platform: PluginPlatformType): string {
  const platInfo = AccountPlatInfoMap.get(platform)
  return platInfo?.name || platform
}

/**
 * 获取平台登录链接
 */
function getPlatformLoginUrl(platform: PluginPlatformType, target: PlatformLoginTarget = 'home') {
  if (platform === PlatType.Xhs && target === 'creator') {
    return XHS_CREATOR_LOGIN_URL
  }

  const platInfo = AccountPlatInfoMap.get(platform)
  return platInfo?.url
}

function renderXhsLoginTip(
  account: PlatAccountInfo | null,
  t: ReturnType<typeof useTranslation>['t'],
) {
  const xhsLoginStage = getXhsLoginStage(account)

  if (xhsLoginStage === 'homeOnly') {
    return (
      <span className="text-xs leading-5 text-warning">
        {t('header.xhsHomeLoggedInOnlyTip')}
      </span>
    )
  }

  if (xhsLoginStage === 'creatorOnly') {
    return (
      <span className="text-xs leading-5 text-warning">
        {t('header.xhsCreatorLoggedInOnlyTip')}
      </span>
    )
  }

  return (
    <span className="text-xs leading-5 text-warning">
      <Trans
        i18nKey="header.xhsNotLoggedInTip"
        ns="plugin"
        components={{
          creatorLink: (
            <a
              href={XHS_CREATOR_LOGIN_URL}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer underline underline-offset-2 transition-opacity hover:opacity-80"
            />
          ),
          homeLink: (
            <a
              href={getPlatformLoginUrl(PlatType.Xhs)}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer underline underline-offset-2 transition-opacity hover:opacity-80"
            />
          ),
        }}
      />
    </span>
  )
}

function getXhsLoginStage(account: PlatAccountInfo | null): XhsLoginStage {
  const xhsLoginStatus = getXhsLoginStatus(account)

  if (!xhsLoginStatus) {
    return 'none'
  }

  if (xhsLoginStatus.home && xhsLoginStatus.creator) {
    return 'ready'
  }

  if (xhsLoginStatus.home) {
    return 'homeOnly'
  }

  if (xhsLoginStatus.creator) {
    return 'creatorOnly'
  }

  return 'none'
}

function getXhsStatusText(
  account: PlatAccountInfo | null,
  t: ReturnType<typeof useTranslation>['t'],
) {
  const xhsLoginStage = getXhsLoginStage(account)

  if (xhsLoginStage === 'homeOnly') {
    return t('header.xhsHomeLoggedInOnlyStatus')
  }

  if (xhsLoginStage === 'creatorOnly') {
    return t('header.xhsCreatorLoggedInOnlyStatus')
  }

  return t('header.notLoggedIn')
}

/**
 * 平台账号 Tab 组件
 */
export function AccountsTab({ highlightPlatform }: AccountsTabProps) {
  const { t } = useTranslation('plugin')
  const { platformAccounts, refreshAllPlatformAccounts, syncAccountToDatabase } = usePluginStore(
    useShallow(state => ({
      platformAccounts: state.platformAccounts,
      refreshAllPlatformAccounts: state.refreshAllPlatformAccounts,
      syncAccountToDatabase: state.syncAccountToDatabase,
    })),
  )
  const closePluginModal = usePluginStore(state => state.closePluginModal)
  const closeChannelManager = useChannelManagerStore(state => state.closeModal)

  const [syncLoading, setSyncLoading] = useState<PluginPlatformType | null>(null)
  const [authPollingPlatform, setAuthPollingPlatform] = useState<PluginPlatformType | null>(null)
  const authPollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const authPollingPlatformRef = useRef<PluginPlatformType | null>(null)
  const authPollingAttemptsRef = useRef(0)
  const authPollingSessionRef = useRef(0)

  const clearAuthPolling = useCallback(() => {
    if (authPollingTimerRef.current) {
      clearTimeout(authPollingTimerRef.current)
      authPollingTimerRef.current = null
    }

    authPollingPlatformRef.current = null
    authPollingAttemptsRef.current = 0
    authPollingSessionRef.current += 1
  }, [])

  const stopAuthPolling = useCallback(() => {
    clearAuthPolling()
    setAuthPollingPlatform(null)
  }, [clearAuthPolling])

  const syncPlatformAccount = useCallback(async (platform: PluginPlatformType) => {
    setSyncLoading(platform)

    try {
      const defaultGroup = useAccountStore.getState().accountGroupList.find(g => g.isDefault)
      const result = await syncAccountToDatabase(platform, defaultGroup?.id)

      if (result) {
        toast.success(t('header.syncSuccess'))
      }
      else {
        toast.error(t('header.syncFailed'))
      }
    }
    catch (error) {
      console.error('同步账号失败:', error)
      toast.error(t('header.syncFailed'))
    }
    finally {
      setSyncLoading(current => current === platform ? null : current)
    }
  }, [syncAccountToDatabase, t])

  const pollPlatformAuthStatus = useCallback(async (
    platform: PluginPlatformType,
    sessionId: number,
  ) => {
    authPollingAttemptsRef.current += 1

    try {
      await refreshAllPlatformAccounts()
    }
    catch (error) {
      console.warn('轮询平台授权状态失败:', error)
    }

    const isPollingCurrentPlatform = authPollingPlatformRef.current === platform
      && authPollingSessionRef.current === sessionId
    const account = usePluginStore.getState().platformAccounts[platform]

    if (!isPollingCurrentPlatform)
      return

    if (isPluginPlatformAccountReady(account)) {
      await syncPlatformAccount(platform)
      stopAuthPolling()
      return
    }

    if (authPollingAttemptsRef.current >= AUTH_POLLING_MAX_ATTEMPTS) {
      stopAuthPolling()
      return
    }

    authPollingTimerRef.current = setTimeout(() => {
      void pollPlatformAuthStatus(platform, sessionId)
    }, AUTH_POLLING_INTERVAL)
  }, [refreshAllPlatformAccounts, stopAuthPolling, syncPlatformAccount])

  const startAuthPolling = useCallback((platform: PluginPlatformType) => {
    if (!shouldStartAuthPolling(platform))
      return

    clearAuthPolling()
    const sessionId = authPollingSessionRef.current + 1
    authPollingSessionRef.current = sessionId
    authPollingPlatformRef.current = platform
    setAuthPollingPlatform(platform)
    void pollPlatformAuthStatus(platform, sessionId)
  }, [clearAuthPolling, pollPlatformAuthStatus])

  const renderAuthPollingStatus = useCallback((platform: PluginPlatformType) => {
    if (authPollingPlatform !== platform)
      return null

    return (
      <div className="flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-xs text-primary shadow-sm shadow-primary/5">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>{t('header.authPolling')}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 cursor-pointer px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
          onClick={stopAuthPolling}
        >
          {t('common.cancel')}
        </Button>
      </div>
    )
  }, [authPollingPlatform, stopAuthPolling, t])

  useEffect(() => {
    return () => {
      clearAuthPolling()
    }
  }, [clearAuthPolling])

  useEffect(() => {
    const platform = authPollingPlatformRef.current

    if (!platform || !isPluginPlatformAccountReady(platformAccounts[platform]))
      return

    void syncPlatformAccount(platform).finally(stopAuthPolling)
  }, [platformAccounts, stopAuthPolling, syncPlatformAccount])

  /**
   * 处理同步账号到数据库
   */
  const handleSyncAccount = async (platform: PluginPlatformType) => {
    await syncPlatformAccount(platform)
  }

  /**
   * 处理去登录
   */
  const handleGoLogin = (
    platform: PluginPlatformType,
    target: PlatformLoginTarget = 'home',
  ) => {
    const loginUrl = getPlatformLoginUrl(platform, target)
    if (loginUrl) {
      window.open(loginUrl, '_blank')
      startAuthPolling(platform)
    }
  }

  const handleViewGuide = () => {
    closePluginModal()
    closeChannelManager()
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* 顶部状态栏 */}
      <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3">
        <CheckCircle className="h-5 w-5 text-success" />
        <span className="text-sm text-success">{t('header.activeDescription')}</span>
      </div>

      {/* 平台账号列表 */}
      <div className="flex flex-col gap-3">
        {PLUGIN_SUPPORTED_PLATFORMS.map((platform) => {
          const account = platformAccounts[platform]
          const isConnected = isPluginPlatformAccountReady(account)
          const xhsLoginStage = platform === PlatType.Xhs
            ? getXhsLoginStage(account)
            : 'none'
          const shouldHighlight = highlightPlatform?.toLowerCase() === platform.toLowerCase()

          return (
            <div
              key={platform}
              className={cn(
                'flex items-center justify-between gap-4 rounded-lg border p-4 transition-all',
                shouldHighlight
                  ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                  : 'border-border bg-card hover:border-border',
              )}
            >
              {/* 左侧：账号信息 */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {account ? (
                  <AvatarPlat
                    account={{
                      type: platform,
                      avatar: account.avatar || '',
                      nickname: account.nickname || '',
                      uid: account.uid || '',
                      id: '0',
                      fansCount: account.fansCount || 0,
                    }}
                    size="large"
                    avatarWidth={44}
                  />
                ) : (
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {getPlatformName(platform).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-foreground">{getPlatformName(platform)}</span>
                  {isConnected ? (
                    <span className="truncate text-sm text-muted-foreground">
                      {account?.nickname || account?.uid}
                    </span>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">
                        {platform === PlatType.Xhs
                          ? getXhsStatusText(account, t)
                          : t('header.notLoggedIn')}
                      </span>
                      {platform === PlatType.Xhs && (
                        renderXhsLoginTip(account, t)
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 右侧：操作按钮 */}
              <div className="shrink-0">
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-success/20 bg-success/10 text-success"
                    >
                      {t('status.connected')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => handleSyncAccount(platform)}
                      disabled={syncLoading === platform}
                    >
                      <RefreshCw
                        className={cn('h-4 w-4', syncLoading === platform && 'animate-spin')}
                      />
                      {t('header.sync')}
                    </Button>
                  </div>
                ) : (
                  platform === PlatType.Xhs
                    ? (
                        <div className="flex flex-col items-end gap-2">
                          {xhsLoginStage === 'homeOnly' && (
                            <Badge
                              variant="outline"
                              className="border-warning/20 bg-warning/10 text-warning"
                            >
                              {t('header.xhsNoteDetailReady')}
                            </Badge>
                          )}
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer gap-1"
                              onClick={() => handleGoLogin(platform)}
                            >
                              <ExternalLink className="h-4 w-4" />
                              {t('header.xhsHome')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer gap-1"
                              onClick={() => handleGoLogin(platform, 'creator')}
                            >
                              <ExternalLink className="h-4 w-4" />
                              {t('header.xhsCreator')}
                            </Button>
                          </div>
                          {renderAuthPollingStatus(platform)}

                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex cursor-help items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                  aria-label={t('header.xhsCreatorQuickLoginLabel')}
                                >
                                  <CircleHelp className="h-3.5 w-3.5 text-warning" />
                                  <span>{t('header.xhsCreatorQuickLoginLabel')}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                align="end"
                                className="max-w-60 text-xs leading-5"
                              >
                                {t('header.xhsCreatorQuickLoginTip')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )
                    : (
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer gap-1"
                            onClick={() => handleGoLogin(platform)}
                          >
                            <ExternalLink className="h-4 w-4" />
                            {t('header.loginNow')}
                          </Button>
                          {renderAuthPollingStatus(platform)}
                        </div>
                      )
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 插件使用教程链接 */}
      <div className="flex justify-center pt-2">
        <Link
          href="/websit/plugin-guide"
          onClick={handleViewGuide}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
        >
          <BookOpen className="h-4 w-4" />
          <span className="text-sm font-medium">{t('header.viewGuide')}</span>
        </Link>
      </div>
    </div>
  )
}
