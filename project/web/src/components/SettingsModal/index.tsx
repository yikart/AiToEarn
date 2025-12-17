/**
 * SettingsModal - 设置弹框组件
 * 包含个人资料、Agent、通用设置等功能
 * 采用可扩展的 Tab 配置结构
 */

'use client'

import type { ReactNode } from 'react'
import { Bot, Globe, User } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import { AgentTab, GeneralTab, ProfileTab } from './tabs'
import logo from '@/assets/images/logo.png'

/** 设置页面类型 */
type SettingsTab = 'profile' | 'agent' | 'general'

/** Tab 配置项类型 */
interface TabConfig {
  key: SettingsTab
  icon: ReactNode
  label: string
  /** 是否需要登录才能显示 */
  requireAuth?: boolean
}

export interface SettingsModalProps {
  /** 是否显示弹框 */
  open: boolean
  /** 关闭弹框回调 */
  onClose: () => void
}

/**
 * SettingsModal 设置弹框组件
 */
export const SettingsModal = ({ open, onClose }: SettingsModalProps) => {
  const { t } = useTransClient('settings')
  const token = useUserStore(state => state.token)

  const isLoggedIn = !!token
  const [activeTab, setActiveTab] = useState<SettingsTab>(isLoggedIn ? 'profile' : 'general')

  // 登录状态变化时重置标签
  useEffect(() => {
    if (!isLoggedIn && activeTab === 'profile') {
      setActiveTab('general')
    }
  }, [isLoggedIn, activeTab])

  // Tab 配置列表（易于扩展）
  const tabConfigs: TabConfig[] = [
    { key: 'profile', icon: <User className="h-4 w-4" />, label: t('tabs.profile'), requireAuth: true },
    { key: 'agent', icon: <Bot className="h-4 w-4" />, label: 'Agent', requireAuth: true },
    { key: 'general', icon: <Globe className="h-4 w-4" />, label: t('tabs.general') },
  ]

  // 根据登录状态过滤 Tab
  const visibleTabs = tabConfigs.filter(tab => !tab.requireAuth || isLoggedIn)

  // 渲染右侧内容
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return isLoggedIn ? <ProfileTab onClose={onClose} /> : <GeneralTab />
      case 'agent':
        return isLoggedIn ? <AgentTab /> : <GeneralTab />
      case 'general':
        return <GeneralTab />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-[880px] gap-0 overflow-hidden p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{t('title')}</DialogTitle>

        <div className="flex min-h-[560px]">
          {/* 左侧侧边栏 */}
          <div className="flex w-52 shrink-0 flex-col border-r border-gray-200">
            {/* 侧边栏头部 - Logo + 项目名称 */}
            <div className="flex shrink-0 items-center gap-2 px-5 py-4">
              <Image src={logo} alt="AIToEarn" width={28} height={28} />
              <span className="text-base font-semibold tracking-tight text-gray-800">AIToEarn</span>
            </div>

            {/* Tab 列表 */}
            <div className="flex flex-1 flex-col gap-1 px-4 pb-4">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.key

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-all',
                      isActive
                        ? 'bg-purple-50 font-medium text-purple-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* 右侧头部 - 设置标题 */}
            <div className="flex shrink-0 items-center border-b border-gray-200 px-8 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
            </div>

            {/* 右侧内容 */}
            <div className="flex-1 overflow-auto px-8 py-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsModal
