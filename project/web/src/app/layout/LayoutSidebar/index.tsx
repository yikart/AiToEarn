/**
 * LayoutSidebar - 左侧侧边栏布局组件
 * 包含 Logo、主导航、底部功能区（余额、插件、VIP、设置）、图标栏、用户头像/登录按钮
 * 支持展开/收缩两种状态
 */
'use client'

import { useState } from 'react'
import { useRouter, useSelectedLayoutSegments } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import NotificationPanel from '@/components/notification/NotificationPanel'
import SettingsModal, { type SettingsTab } from '@/components/SettingsModal'
import { routerData } from '@/app/layout/routerData'
import {
  LogoSection,
  NavSection,
  BottomSection,
  IconBar,
  UserSection,
} from './components'
import { useSettingsModalStore } from '@/components/SettingsModal/store'

/**
 * 侧边栏主组件
 */
const LayoutSidebar = () => {
  const router = useRouter()
  const token = useUserStore(state => state.token)
  const route = useSelectedLayoutSegments()
  const { unreadCount } = useNotification()

  // UI 状态
  const [collapsed, setCollapsed] = useState(false)
  const [notificationVisible, setNotificationVisible] = useState(false)
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

  // 处理登录跳转
  const handleLogin = () => {
    router.push(`/auth/login`)
  }

  // 打开设置弹框
  const handleOpenSettings = (defaultTab?: SettingsTab) => {
    openSettings(defaultTab)
  }

  // 关闭设置弹框
  const handleCloseSettings = () => {
    closeSettings()
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
        {/* Logo 区域 */}
        <LogoSection
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />

        {/* 主导航区域 */}
        <NavSection
          items={navItems}
          currentRoute={currRouter}
          collapsed={collapsed}
        />

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
        />

        {/* 用户头像 / 登录按钮 */}
        <UserSection
          collapsed={collapsed}
          onLogin={handleLogin}
        />
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
    </>
  )
}

export default LayoutSidebar
