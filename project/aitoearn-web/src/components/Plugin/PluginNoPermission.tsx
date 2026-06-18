/**
 * PluginNoPermission - 插件未授权状态组件
 * 显示授权引导和检查权限按钮
 */

'use client'

import { AlertTriangle, BookOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useChannelManagerStore } from '@/components/ChannelManager'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { usePluginStore } from '@/store/plugin'

/**
 * 插件未授权状态组件
 */
export function PluginNoPermission() {
  const { t } = useTranslation('plugin')
  const init = usePluginStore(state => state.init)
  const hostAccessGranted = usePluginStore(state => state.hostAccessGranted)
  const closePluginModal = usePluginStore(state => state.closePluginModal)
  const closeChannelManager = useChannelManagerStore(state => state.closeModal)
  const [checking, setChecking] = useState(false)

  // 检查权限
  const handleCheckPermission = async () => {
    setChecking(true)
    try {
      await init()
    }
    finally {
      setChecking(false)
    }
  }

  const handleViewGuide = () => {
    closePluginModal()
    closeChannelManager()
  }

  return (
    <div className="flex flex-col items-center py-8 px-4">
      {/* 图标 */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
        <AlertTriangle className="h-10 w-10 text-warning" />
      </div>

      {/* 标题 */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {t('header.permissionRequired')}
      </h3>

      {/* 描述 */}
      <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
        {t('header.permissionDescription')}
      </p>

      {hostAccessGranted === false && (
        <Alert className="mb-6 max-w-sm border-warning/30 bg-warning/10 text-foreground [&>svg]:text-warning">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <AlertTitle>{t('header.siteAccessRequiredTitle')}</AlertTitle>
            <AlertDescription>
              <p>{t('header.siteAccessRequiredDescription')}</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                <li>{t('header.siteAccessStepReauthorize')}</li>
                <li>{t('header.siteAccessStepExtensionSettings')}</li>
              </ol>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* 检查权限按钮 */}
      <Button onClick={handleCheckPermission} disabled={checking} className="cursor-pointer gap-2">
        {checking && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('header.checkPermission')}
      </Button>

      {/* 查看安装教程链接 */}
      <Link
        href="/websit/plugin-guide#authorize"
        onClick={handleViewGuide}
        className="mt-6 flex w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-warning transition-colors hover:bg-warning/15"
      >
        <BookOpen className="h-5 w-5" />
        <span className="font-medium">{t('header.viewGuide')}</span>
      </Link>
    </div>
  )
}
