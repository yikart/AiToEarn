/**
 * BottomSection - 底部功能区容器
 * 包含余额、插件、VIP、设置入口
 */

'use client'

import { cn } from '@/lib/utils'
import type { BottomSectionProps } from '../../types'
import { BalanceEntry } from './BalanceEntry'
import { PluginEntry } from './PluginEntry'
import { VipEntry } from './VipEntry'

export function BottomSection({ collapsed, onOpenSettings }: BottomSectionProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-t border-sidebar-border pt-3',
        collapsed && 'items-center',
      )}
    >
      {/* 余额入口 */}
      <BalanceEntry
        collapsed={collapsed}
        onClick={() => onOpenSettings('subscription')}
      />

      {/* 浏览器插件入口 */}
      <PluginEntry collapsed={collapsed} />

      {/* VIP 会员入口 */}
      <VipEntry collapsed={collapsed} />
    </div>
  )
}

// 导出子组件
export { BalanceEntry } from './BalanceEntry'
export { PluginEntry } from './PluginEntry'
export { VipEntry } from './VipEntry'

