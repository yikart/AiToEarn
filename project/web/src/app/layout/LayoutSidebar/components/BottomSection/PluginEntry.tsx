/**
 * PluginEntry - 插件入口组件
 * 根据插件状态显示不同颜色
 */

'use client'

import type { SidebarCommonProps } from '../../types'
import { Puzzle } from 'lucide-react'
import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { PluginModal } from '@/components/Plugin'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { usePluginStore } from '@/store/plugin'
import { PluginStatus } from '@/store/plugin/types/baseTypes'

export function PluginEntry({ collapsed }: SidebarCommonProps) {
  const { t } = useTransClient('common')
  const pluginStatus = usePluginStore(state => state.status)
  const [pluginModalVisible, setPluginModalVisible] = useState(false)

  // 根据插件状态返回对应的颜色和状态文本
  const getStatusInfo = () => {
    switch (pluginStatus) {
      case PluginStatus.READY:
        return {
          iconColor: 'text-success',
          dotColor: 'bg-success',
          statusText: t('pluginStatus.ready'),
          statusColor: 'text-success',
        }
      case PluginStatus.INSTALLED_NO_PERMISSION:
        return {
          iconColor: 'text-warning',
          dotColor: 'bg-warning',
          statusText: t('pluginStatus.noPermission'),
          statusColor: 'text-warning',
        }
      case PluginStatus.CHECKING:
        return {
          iconColor: 'text-info',
          dotColor: 'bg-info animate-pulse',
          statusText: t('pluginStatus.checking'),
          statusColor: 'text-info',
        }
      case PluginStatus.NOT_INSTALLED:
      case PluginStatus.UNKNOWN:
      default:
        return {
          iconColor: 'text-muted-foreground/70',
          dotColor: 'bg-muted-foreground/70',
          statusText: t('pluginStatus.notInstalled'),
          statusColor: 'text-muted-foreground/70',
        }
    }
  }

  const { iconColor, dotColor, statusText, statusColor } = getStatusInfo()

  const content = (
    <button
      onClick={() => setPluginModalVisible(true)}
      className={cn(
        'flex w-full cursor-pointer items-center rounded-lg border-none bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        collapsed ? 'h-9 w-9 justify-center' : 'justify-between px-3 py-2',
      )}
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <Puzzle size={18} className={iconColor} />
          {/* 状态指示点 */}
          <span
            className={cn(
              'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-background',
              dotColor,
            )}
          />
        </div>
        {!collapsed && <span className="text-sm">{t('plugin')}</span>}
      </div>
      {!collapsed && <span className={cn('text-xs', statusColor)}>{statusText}</span>}
    </button>
  )

  return (
    <>
      {collapsed ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">
              <p>
                {t('plugin')}
                {' '}
                -
                {statusText}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        content
      )}

      {/* 插件状态弹框 */}
      <PluginModal visible={pluginModalVisible} onClose={() => setPluginModalVisible(false)} />
    </>
  )
}
