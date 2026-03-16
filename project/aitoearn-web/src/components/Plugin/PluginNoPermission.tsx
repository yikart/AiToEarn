/**
 * PluginNoPermission - 插件未授权状态组件
 * 显示授权引导和检查权限按钮
 */

'use client'

import { AlertTriangle, BookOpen, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { usePluginStore } from '@/store/plugin'

/**
 * 插件未授权状态组件
 */
export function PluginNoPermission() {
  const { t } = useTranslation('plugin')
  const init = usePluginStore(state => state.init)
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

      {/* 检查权限按钮 */}
      <Button onClick={handleCheckPermission} disabled={checking} className="gap-2">
        {checking && <RefreshCw className="h-4 w-4 animate-spin" />}
        {t('header.checkPermission')}
      </Button>

      {/* 查看安装教程链接 */}
      <Link
        href="/websit/plugin-guide"
        className="mt-6 flex items-center justify-center gap-2 w-full max-w-xs px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
      >
        <BookOpen className="h-5 w-5" />
        <span className="font-medium">{t('header.viewGuide')}</span>
      </Link>
    </div>
  )
}
