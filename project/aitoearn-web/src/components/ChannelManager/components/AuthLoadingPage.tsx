/**
 * AuthLoadingPage - 授权Loading页
 * 显示授权等待状态、倒计时和操作按钮
 */

'use client'

import { AlertCircle, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react'
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { PlatformIcon } from '@/components/common/PlatformIcon'
import { Button } from '@/components/ui/button'
import { usePlatformInfo } from '@/hooks/usePlatformMetadata'
import { useChannelManagerStore } from '../channelManagerStore'

export function AuthLoadingPage() {
  const { t } = useTransClient('account')

  const { authState, targetSpaceId, setCurrentView, reopenAuthWindow, stopAuth, startAuth }
    = useChannelManagerStore(
      useShallow(state => ({
        authState: state.authState,
        targetSpaceId: state.targetSpaceId,
        setCurrentView: state.setCurrentView,
        reopenAuthWindow: state.reopenAuthWindow,
        stopAuth: state.stopAuth,
        startAuth: state.startAuth,
      })),
    )

  const { platform, countdown, isPolling, error, isTimeout, authMode, qrCodeDataUrl } = authState

  // 获取平台信息
  const platformInfo = usePlatformInfo(platform)

  const hasQrAuthInstruction = Boolean(platformInfo?.authInstruction)
  const qrAuthHeaderText = platformInfo?.authInstruction
    || t('channelManager.qrAuthTitle', { platform: platformInfo?.name ?? platform ?? '' })
  const qrAuthTip = hasQrAuthInstruction
    ? null
    : t('channelManager.qrAuthTip', { platform: platformInfo?.name ?? platform ?? '' })

  // 格式化倒计时
  const formattedCountdown = useMemo(() => {
    const minutes = Math.floor(countdown / 60)
    const seconds = countdown % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [countdown])

  // 处理取消
  const handleCancel = () => {
    stopAuth()
    setCurrentView('connect-list')
  }

  // 处理重试
  const handleRetry = () => {
    if (platform) {
      startAuth(platform, targetSpaceId || undefined)
    }
  }

  // 如果没有平台信息，显示错误
  if (!platformInfo || !platform) {
    return (
      <div data-testid="cm-auth-error" className="flex h-full flex-col items-center justify-center p-8">
        <AlertCircle className="mb-4 h-16 w-16 text-destructive" />
        <p className="text-lg text-muted-foreground">{t('channelManager.authError')}</p>
        <Button className="mt-4 cursor-pointer" onClick={handleCancel}>
          {t('common.back')}
        </Button>
      </div>
    )
  }

  // 超时或错误状态
  if (isTimeout || error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <PlatformIcon
            platform={platform}
            width={56}
            height={56}
            className="h-14 w-14 object-contain opacity-50 grayscale"
          />
        </div>

        <div className="mb-2 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span className="text-lg font-medium">
            {isTimeout ? t('channelManager.authTimeout') : t('channelManager.authFailed')}
          </span>
        </div>

        <p className="mb-6 text-center text-sm text-muted-foreground">
          {isTimeout
            ? t('channelManager.authTimeoutTip')
            : error || t('channelManager.authFailedTip')}
        </p>

        <div className="flex gap-3">
          <Button data-testid="cm-auth-cancel-btn" variant="outline" className="cursor-pointer" onClick={handleCancel}>
            {t('cancel')}
          </Button>
          <Button data-testid="cm-auth-retry-btn" className="cursor-pointer" onClick={handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('channelManager.retry')}
          </Button>
        </div>
      </div>
    )
  }

  // 正在授权状态
  if (authMode === 'miniappQr') {
    return (
      <div data-testid="cm-auth-douyin-miniapp-qr" className="flex h-full flex-col items-center justify-center p-8">
        <div className="mb-5 flex max-w-md items-center justify-center gap-3">
          <PlatformIcon
            platform={platform}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
          />
          {hasQrAuthInstruction
            ? (
                <p className="text-left text-sm leading-6 text-muted-foreground">
                  {qrAuthHeaderText}
                </p>
              )
            : (
                <h2 className="text-center text-xl font-semibold">
                  {qrAuthHeaderText}
                </h2>
              )}
        </div>

        <div className="mb-5 flex h-56 w-56 items-center justify-center rounded-lg border border-border bg-card p-3">
          {qrCodeDataUrl
            ? (
                <img
                  src={qrCodeDataUrl}
                  alt={t('channelManager.qrAuthAlt', { platform: platformInfo.name })}
                  className="h-full w-full object-contain"
                />
              )
            : (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              )}
        </div>

        {qrAuthTip && (
          <p className="mb-5 max-w-sm text-center text-sm text-muted-foreground">
            {qrAuthTip}
          </p>
        )}

        <div className="mb-7 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('channelManager.remainingTime')}</span>
          <span data-testid="cm-auth-countdown" className="font-mono text-2xl font-bold text-primary">{formattedCountdown}</span>
        </div>

        <div className="flex gap-3">
          <Button data-testid="cm-auth-cancel-btn" variant="outline" className="cursor-pointer" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            {t('cancel')}
          </Button>
          <Button data-testid="cm-auth-refresh-qr-btn" className="cursor-pointer" onClick={reopenAuthWindow}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('channelManager.refreshQrCode')}
          </Button>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {t('channelManager.autoRedirectTip')}
        </p>
      </div>
    )
  }

  return (
    <div data-testid="cm-auth-loading" className="flex h-full flex-col items-center justify-center p-8">
      {/* 平台图标和loading动画 */}
      <div className="relative mb-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
          <PlatformIcon
            platform={platform}
            width={64}
            height={64}
            className="h-16 w-16 object-contain"
          />
        </div>
        {/* 旋转边框动画 */}
        {isPolling && (
          <div
            className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
            style={{ animationDuration: '2s' }}
          />
        )}
      </div>

      {/* 标题 */}
      <h2 className="mb-2 text-xl font-semibold">
        {t('channelManager.connecting', { platform: platformInfo.name })}
      </h2>

      {/* 提示文案 */}
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {t('channelManager.authWaitingTip')}
      </p>

      {/* 倒计时 */}
      <div className="mb-8 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t('channelManager.remainingTime')}</span>
        <span data-testid="cm-auth-countdown" className="font-mono text-2xl font-bold text-primary">{formattedCountdown}</span>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button data-testid="cm-auth-cancel-btn" variant="outline" className="cursor-pointer" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          {t('cancel')}
        </Button>
        <Button data-testid="cm-auth-reopen-btn" className="cursor-pointer" onClick={reopenAuthWindow}>
          <ExternalLink className="mr-2 h-4 w-4" />
          {t('channelManager.reopenAuthPage')}
        </Button>
      </div>

      {/* 底部提示 */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        {t('channelManager.autoRedirectTip')}
      </p>
    </div>
  )
}
