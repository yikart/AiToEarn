/**
 * BottomSection - 底部功能区容器
 * 包含插件入口
 */

'use client'

import type { BottomSectionProps } from '../../types'
import { cn } from '@/lib/utils'
import { PluginEntry } from './PluginEntry'

export function BottomSection({ collapsed }: BottomSectionProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-t border-sidebar-border pt-3',
        collapsed && 'items-center',
      )}
    >
      {/* 浏览器插件入口 */}
      <PluginEntry collapsed={collapsed} />
    </div>
  )
}

// 导出子组件
export { PluginEntry } from './PluginEntry'
