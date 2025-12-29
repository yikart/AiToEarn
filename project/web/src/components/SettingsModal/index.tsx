/**
 * SettingsModal - 设置弹框组件
 * 包含个人资料、Agent、通用设置等功能
 * 采用可扩展的 Tab 配置结构
 * 支持移动端响应式布局
 */

'use client'

import type { ReactNode } from 'react'
import { CreditCard, Crown, Globe, User } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import logo from '@/assets/images/logo.png'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import { AgentTab, GeneralTab, MembershipTab, ProfileTab, SubscriptionTab } from './tabs'

/** 设置页面类型 */
type SettingsTab = 'profile' | 'subscription' | 'membership' | 'general'

/** Tab 配置项类型 */
interface TabConfig {
  key: SettingsTab
  icon: ReactNode
  label: string
  /** 是否需要登录才能显示 */
  requireAuth?: boolean
}

/** 设置页面类型（导出供外部使用） */
export type { SettingsTab }

export interface SettingsModalProps {
  /** 是否显示弹框 */
  open: boolean
  /** 关闭弹框回调 */
  onClose: () => void
  /** 默认选中的 Tab */
  defaultTab?: SettingsTab
}

/**
 * SettingsModal 设置弹框组件
 */
export function SettingsModal({ open, onClose, defaultTab }: SettingsModalProps) {
  const { t } = useTransClient('settings')
  const token = useUserStore(state => state.token)
  const userInfo = useUserStore(state => state.userInfo)

  const isLoggedIn = !!token
  const [activeTab, setActiveTab] = useState<SettingsTab>(isLoggedIn ? 'profile' : 'general')

  // 打开弹框时，如果有 defaultTab 则使用它
  useEffect(() => {
    if (open && defaultTab && isLoggedIn) {
      setActiveTab(defaultTab)
    }
  }, [open, defaultTab, isLoggedIn])

  // 登录状态变化时重置标签
  useEffect(() => {
    if (!isLoggedIn && activeTab === 'profile') {
      setActiveTab('general')
    }
  }, [isLoggedIn, activeTab])

  // Tab 配置列表（易于扩展）
  const tabConfigs: TabConfig[] = [
    { key: 'profile', icon: <User className="h-4 w-4" />, label: t('tabs.profile'), requireAuth: true },
    { key: 'subscription', icon: <CreditCard className="h-4 w-4" />, label: t('tabs.subscription'), requireAuth: true },
    // 会员 Tab：只有用户曾经有过 vipInfo 才显示
    ...(userInfo?.vipInfo
      ? [{
          key: 'membership' as SettingsTab,
          icon: <Crown className="h-4 w-4" />,
          label: t('tabs.membership' as any) ?? '会员',
          requireAuth: true,
        }]
      : []),
    { key: 'general', icon: <Globe className="h-4 w-4" />, label: t('tabs.general') },
  ]

  // 根据登录状态过滤 Tab
  const visibleTabs = tabConfigs.filter(tab => !tab.requireAuth || isLoggedIn)

  // 渲染右侧内容
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return isLoggedIn ? <ProfileTab onClose={onClose} /> : <GeneralTab />
      case 'subscription':
        return isLoggedIn ? <SubscriptionTab /> : <GeneralTab />
      case 'membership':
        return isLoggedIn ? <MembershipTab /> : <GeneralTab />
      case 'general':
        return <GeneralTab />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent
        className="w-[95vw] max-w-[900px] gap-0 overflow-hidden p-0 md:w-[900px]"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{t('title')}</DialogTitle>

        {/* 移动端布局：垂直排列；桌面端：水平排列 */}
        <div className="flex h-[85vh] max-h-[650px] flex-col md:h-[70vh] md:max-h-none md:flex-row">
          {/* 侧边栏/顶部导航 */}
          <div className="flex w-full shrink-0 flex-col border-b border-border md:w-52 md:border-b-0 md:border-r">
            {/* 侧边栏头部 - Logo + 项目名称 */}
            <div className="flex shrink-0 items-center gap-2 px-4 py-3 md:px-5 md:py-4">
              <Image src={logo} alt="Aitoearn" width={24} height={24} className="md:h-7 md:w-7" />
              <span className="text-sm font-semibold tracking-tight text-foreground md:text-base">Aitoearn</span>
            </div>

            {/* Tab 列表 - 移动端水平滚动，桌面端垂直列表 */}
            <div className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-x-visible md:px-3 md:pb-4">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.key

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-left text-sm transition-all md:gap-2 md:py-2.5',
                      isActive
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {tab.icon}
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 右侧/下方内容区域 */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {/* 右侧头部 - 设置标题 */}
            <div className="flex shrink-0 items-center border-b border-border px-4 py-3 md:px-6 md:py-4">
              <h2 className="text-base font-semibold text-foreground md:text-lg">{t('title')}</h2>
            </div>

            {/* 右侧内容 - 确保内容区域可以正确滚动 */}
            <div className="flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6">
              <div className="w-full min-w-0">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsModal
