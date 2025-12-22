/**
 * PluginReady - 插件已就绪状态组件
 * 使用左侧 Tab 导航布局，包含平台账号和发布列表两个 Tab
 */

'use client'

import type { PublishTask } from '@/store/plugin/types/baseTypes'
import { ListTodo, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
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

  return (
    <div className="flex h-[420px] flex-1">
      {/* 左侧 Tab 导航 */}
      <div className="flex w-40 shrink-0 flex-col gap-1 border-r border-gray-200 pr-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-all',
                isActive
                  ? 'bg-purple-50 font-medium text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon className="h-4 w-4" />
              {t(tab.labelKey as any)}
            </button>
          )
        })}
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 overflow-auto pl-4 flex">
        {activeTab === 'accounts' && (
          <AccountsTab highlightPlatform={highlightPlatform} />
        )}
        {activeTab === 'publish' && (
          <PublishListTab onViewDetail={onViewDetail} />
        )}
      </div>
    </div>
  )
}
