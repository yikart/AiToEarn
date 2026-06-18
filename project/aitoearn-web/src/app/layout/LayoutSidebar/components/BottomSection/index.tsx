/**
 * BottomSection - 底部功能区容器
 * 开源版仅保留浏览器插件入口。
 */

'use client'

import type { BottomSectionProps } from '../../types'
import { cn } from '@/utils/className'
import { PluginEntry } from './PluginEntry'

export function BottomSection({ collapsed }: BottomSectionProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-t border-sidebar-border pt-3',
        collapsed && 'items-center',
      )}
    >
      <PluginEntry collapsed={collapsed} />
    </div>
  )
}

export { PluginEntry } from './PluginEntry'
