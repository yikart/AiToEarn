/**
 * PluginNoPermission - 插件未授权状态组件
 * 显示授权引导和检查权限按钮
 */

'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePluginStore } from '@/store/plugin'
import { Button } from '@/components/ui/button'

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
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
      </div>

      {/* 标题 */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {t('header.permissionRequired')}
      </h3>

      {/* 描述 */}
      <p className="mb-8 max-w-sm text-center text-sm text-gray-500">
        {t('header.permissionDescription')}
      </p>

      {/* 检查权限按钮 */}
      <Button
        onClick={handleCheckPermission}
        disabled={checking}
        className="gap-2"
      >
        {checking && <RefreshCw className="h-4 w-4 animate-spin" />}
        {t('header.checkPermission')}
      </Button>
    </div>
  )
}

