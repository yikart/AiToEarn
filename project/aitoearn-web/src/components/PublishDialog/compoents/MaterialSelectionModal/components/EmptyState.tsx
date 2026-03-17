/**
 * EmptyState - 空状态组件
 * 当没有分组或媒体时显示
 */

'use client'

import { Bot, FolderOpen, Image as ImageIcon, Video } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'

interface EmptyStateProps {
  /** 类型：分组或媒体 */
  type: 'group' | 'media'
  /** 媒体类型 */
  mediaType?: 'video' | 'img'
  /** 是否是 Agent 分组 */
  isAgentGroup?: boolean
}

export function EmptyState({ type, mediaType, isAgentGroup }: EmptyStateProps) {
  const { t } = useTransClient('material')

  const getIcon = () => {
    if (type === 'group') {
      return <FolderOpen className="w-12 h-12 text-muted-foreground/40" />
    }
    // Agent 分组使用 Bot 图标
    if (isAgentGroup) {
      return <Bot className="w-12 h-12 text-muted-foreground/40" />
    }
    if (mediaType === 'video') {
      return <Video className="w-12 h-12 text-muted-foreground/40" />
    }
    return <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
  }

  const getTitle = () => {
    if (type === 'group') {
      return t('mediaManagement.noGroups')
    }
    // Agent 分组空状态标题
    if (isAgentGroup) {
      return t('agentAssets.noAssets')
    }
    return t('mediaManagement.noMedia')
  }

  const getDescription = () => {
    if (type === 'group') {
      return t('mediaManagement.noGroupsDesc')
    }
    // Agent 分组空状态描述
    if (isAgentGroup) {
      return t('agentAssets.noAssetsDesc')
    }
    return t('mediaManagement.noMediaDesc')
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {getIcon()}
      <h3 className="mt-4 text-lg font-medium text-foreground">{getTitle()}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">{getDescription()}</p>
    </div>
  )
}
