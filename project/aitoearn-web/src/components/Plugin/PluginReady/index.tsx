/**
 * PluginReady - 插件已就绪状态组件
 * 使用左侧 Tab 导航布局，包含平台账号和发布列表两个 Tab
 */

'use client'

import type { PublishTask } from '@/store/plugin/types/baseTypes'
import { ListTodo, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { usePluginStore } from '@/store/plugin'
import { PluginUpdatePopover } from '../PluginUpdatePopover'
import { AccountsTab } from './AccountsTab'
import { PublishListTab } from './PublishListTab'

type TabType = 'accounts' | 'publish'

interface PluginReadyProps {
  /** 需要高亮的平台 */
  highlightPlatform?: string | null
  /** 点击任务详情回调 */
  onViewDetail?: (task: PublishTask) => void
}

/**
 * Tab 配置
 */
const tabs = [
  { id: 'accounts' as const, icon: Users, labelKey: 'header.platformAccounts' },
  { id: 'publish' as const, icon: ListTodo, labelKey: 'publishList.title' },
]

/**
 * 插件已就绪状态组件
 */
export function PluginReady({ highlightPlatform, onViewDetail }: PluginReadyProps) {
  const { t } = useTranslation('plugin')
  const [activeTab, setActiveTab] = useState<TabType>('accounts')
  const { pluginNeedsUpdate, pluginVersion } = usePluginStore(
    useShallow(state => ({
      pluginNeedsUpdate: state.pluginNeedsUpdate,
      pluginVersion: state.pluginVersion,
    })),
  )

  return (
    <div className="flex h-[420px] flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <div className="flex w-40 shrink-0 flex-col gap-1 border-r border-border pr-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-all',
                  isActive
                    ? 'bg-purple-50 font-medium text-purple-600'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {t(tab.labelKey)}
              </button>
            )
          })}
        </div>

        <div className="flex min-w-0 flex-1 pl-4">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-auto">
              {activeTab === 'accounts' && <AccountsTab highlightPlatform={highlightPlatform} />}
              {activeTab === 'publish' && <PublishListTab onViewDetail={onViewDetail} />}
            </div>

            {pluginVersion && (
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 text-xs">
                {pluginNeedsUpdate ? (
                  <PluginUpdatePopover currentVersion={pluginVersion}>
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-medium text-warning transition-colors hover:bg-warning/15"
                    >
                      {t('version.updatableTag')}
                    </button>
                  </PluginUpdatePopover>
                ) : (
                  <Badge
                    variant="outline"
                    className="rounded-full border-success/20 bg-success/10 px-3 py-1 text-xs font-medium text-success"
                  >
                    {t('version.title')}
                    {' '}
                    {pluginVersion}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
