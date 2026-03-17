/**
 * EmptyState - 空状态组件
 * 当没有素材分组时显示
 */

'use client'

import { FolderOpen, Plus } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  /** 创建按钮点击回调 */
  onCreateClick: () => void
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  const { t } = useTransClient('material')

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* 图标 */}
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <FolderOpen className="w-10 h-10 text-muted-foreground" />
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-medium text-foreground mb-2">{t('mediaManagement.noGroups')}</h3>

      {/* 描述 */}
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        {t('mediaManagement.noGroupsDesc')}
      </p>

      {/* 创建按钮 */}
      <Button onClick={onCreateClick} className="cursor-pointer">
        <Plus className="w-4 h-4 mr-2" />
        {t('mediaManagement.createNow')}
      </Button>
    </div>
  )
}
