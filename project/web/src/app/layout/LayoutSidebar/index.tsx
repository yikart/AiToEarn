/**
 * LayoutSidebar - 左侧侧边栏布局组件
 * 包含 Logo、主导航、底部功能区（余额、插件、VIP、设置）、图标栏、用户头像/登录按钮
 * 支持展开/收缩两种状态
 */
'use client'

import type { SettingsTab } from '@/components/SettingsModal'
import { useRouter, useSelectedLayoutSegments } from 'next/navigation'
import { useState } from 'react'
import { useShallow } from 'zustand/shallow'
import AddAccountModal from '@/app/[lng]/accounts/components/AddAccountModal'
import { routerData } from '@/app/layout/routerData'
import { ExternalLinks } from '@/app/layout/shared'
import NotificationPanel from '@/components/notification/NotificationPanel'
import SettingsModal from '@/components/SettingsModal'
import { useSettingsModalStore } from '@/components/SettingsModal/store'
import { useNotification } from '@/hooks/useNotification'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { openLoginModal } from '@/store/loginModal'
import { useUserStore } from '@/store/user'
import {
  BottomSection,
  IconBar,
  LogoSection,
  NavSection,
  UserSection,
} from './components'
import { AffiliatesEntry } from './components/BottomSection/AffiliatesEntry'
import { MyChannelsEntry } from './components/BottomSection/MyChannelsEntry'

/**
 * 侧边栏主组件
 */
function LayoutSidebar() {
  const router = useRouter()
  const token = useUserStore(state => state.token)
  const route = useSelectedLayoutSegments()
  const { unreadCount } = useNotification()

  // 获取侧边栏状态和设置方法
  const {
    sidebarCollapsed: collapsed,
    setSidebarCollapsed: setCollapsed,
  } = useUserStore(
    useShallow(state => ({
      sidebarCollapsed: state.sidebarCollapsed,
      setSidebarCollapsed: state.setSidebarCollapsed,
    })),
  )

  // UI 状态
  const [notificationVisible, setNotificationVisible] = useState(false)
  const [addAccountVisible, setAddAccountVisible] = useState(false)
  const {
    settingsVisible,
    settingsDefaultTab,
    openSettings,
    closeSettings,
  } = useSettingsModalStore()

  // 获取当前路由
  let currRouter = '/'
  if (route.length === 1) {
    currRouter = route[0]
    currRouter = currRouter === '/' ? currRouter : `/${currRouter}`
  }
  else if (route.length >= 2) {
    currRouter = `/${route.slice(0, 2).join('/')}`
  }

  // auth 和 websit 页面不显示侧边栏
  const isAuthPage = route[0] === 'auth' || route[0] === 'websit'
  if (isAuthPage) {
    return null
  }

  // 处理登录弹窗
  const handleLogin = () => {
    openLoginModal()
  }

  // 打开设置弹框
  const handleOpenSettings = (defaultTab?: SettingsTab) => {
    openSettings(defaultTab)
  }

  // 关闭设置弹框
  const handleCloseSettings = () => {
    closeSettings()
  }

  // 打开添加账号弹窗
  const handleAddChannel = () => {
    if (!token) {
      toast.warning('Please login first')
      openLoginModal(() => setAddAccountVisible(true))
      return
    }
    setAddAccountVisible(true)
  }

  // 转换路由数据为 NavSection 所需格式
  const navItems = routerData.map(item => ({
    path: item.path || '/',
    translationKey: item.translationKey,
    icon: item.icon,
  }))

  return (
    <>
      <aside
        className={cn(
          'group sticky left-0 top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar p-3 transition-all duration-300 md:flex',
          collapsed ? 'w-[68px] min-w-[68px]' : 'w-[220px] min-w-[220px]',
        )}
      >
        {/* Logo 区域 - 固定 */}
        <LogoSection
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />

        {/* 可滚动区域：主导航 */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <NavSection
            items={navItems}
            currentRoute={currRouter}
            collapsed={collapsed}
            onAddChannel={handleAddChannel}
          />
        </div>

        {/* 底部固定区域 - 不随滚动 */}
        <div className="flex-shrink-0">
          {/* 我的频道入口 */}
          <div className="pb-1 flex flex-1">
            <MyChannelsEntry collapsed={collapsed} />
          </div>

          {/* 推广赚钱入口 - 在底部功能区横线上方 */}
          <div className="pb-1">
            <AffiliatesEntry collapsed={collapsed} />
          </div>

          {/* 底部功能区 */}
          <BottomSection
            collapsed={collapsed}
            onOpenSettings={handleOpenSettings}
          />

          {/* 底部图标栏 */}
          <IconBar
            collapsed={collapsed}
            isLoggedIn={!!token}
            unreadCount={unreadCount}
            onOpenNotification={() => setNotificationVisible(true)}
            onOpenSettings={handleOpenSettings}
          />

          {/* 用户头像 / 登录按钮 */}
          <UserSection
            collapsed={collapsed}
            onLogin={handleLogin}
            onOpenSettings={handleOpenSettings}
          />

          {/* 外部链接 - Docs 和 GitHub */}
          <ExternalLinks collapsed={collapsed} />
        </div>
      </aside>

      {/* 通知面板 */}
      <NotificationPanel
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />

      {/* 设置弹框 */}
      <SettingsModal
        open={settingsVisible}
        onClose={handleCloseSettings}
        defaultTab={settingsDefaultTab}
      />

      {/* 添加账号弹窗 */}
      <AddAccountModal
        open={addAccountVisible}
        onClose={() => setAddAccountVisible(false)}
        onAddSuccess={() => {
          setAddAccountVisible(false)
        }}
        showSpaceSelector={true}
      />

    </>
  )
}

export default LayoutSidebar
