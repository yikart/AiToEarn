/**
 * PublishListTab - 发布列表 Tab 组件
 * 显示插件发布任务列表
 */

'use client'

import type { PluginPlatformType, PublishTask } from '@/store/plugin/types/baseTypes'
import { FileText } from 'lucide-react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { Badge } from '@/components/ui/badge'
import { usePluginStore } from '@/store/plugin'
import { PlatformTaskStatus } from '@/store/plugin/types/baseTypes'
import { cn } from '@/lib/utils'

interface PublishListTabProps {
  /** 点击任务回调 */
  onViewDetail?: (task: PublishTask) => void
}

/**
 * 获取平台显示名称
 */
function getPlatformName(platform: PluginPlatformType): string {
  const platInfo = AccountPlatInfoMap.get(platform)
  return platInfo?.name || platform
}

/**
 * 获取状态 Badge 样式
 */
function getStatusVariant(status: PlatformTaskStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case PlatformTaskStatus.COMPLETED:
      return 'default'
    case PlatformTaskStatus.PUBLISHING:
      return 'secondary'
    case PlatformTaskStatus.ERROR:
      return 'destructive'
    default:
      return 'outline'
  }
}

/**
 * 获取状态 Badge 自定义类名
 */
function getStatusClassName(status: PlatformTaskStatus): string {
  switch (status) {
    case PlatformTaskStatus.COMPLETED:
      return 'bg-green-100 text-green-700 hover:bg-green-100'
    case PlatformTaskStatus.PUBLISHING:
      return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
    case PlatformTaskStatus.ERROR:
      return 'bg-red-100 text-red-700 hover:bg-red-100'
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-100'
  }
}

/**
 * 发布列表 Tab 组件
 */
export function PublishListTab({ onViewDetail }: PublishListTabProps) {
  const { t } = useTranslation('plugin')
  const publishTasks = usePluginStore(state => state.publishTasks) || []

  // 空状态
  if (publishTasks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">{t('publishList.empty')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {publishTasks.map(task => (
        <div
          key={task.id}
          className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-sm"
          onClick={() => onViewDetail?.(task)}
        >
          {/* 左侧：任务信息 */}
          <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
            <span className="truncate font-medium text-gray-900">
              {task.title || t('publishList.untitled' as any)}
            </span>
            <div className="flex items-center gap-2">
              {/* 平台标签 */}
              <div className="flex gap-1">
                {task.platformTasks.slice(0, 3).map(pt => (
                  <Badge
                    key={pt.platform}
                    variant="outline"
                    className="text-xs"
                  >
                    {getPlatformName(pt.platform as PluginPlatformType)}
                  </Badge>
                ))}
                {task.platformTasks.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{task.platformTasks.length - 3}
                  </Badge>
                )}
              </div>
              {/* 时间 */}
              <span className="text-xs text-gray-400">
                {dayjs(task.createdAt).format('MM-DD HH:mm')}
              </span>
            </div>
          </div>

          {/* 右侧：状态 */}
          <Badge
            variant="secondary"
            className={cn('ml-3 shrink-0', getStatusClassName(task.overallStatus))}
          >
            {t(`common.${task.overallStatus}`)}
          </Badge>
        </div>
      ))}
    </div>
  )
}
