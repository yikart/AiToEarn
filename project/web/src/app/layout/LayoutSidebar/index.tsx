/**
 * LayoutSidebar - 左侧侧边栏布局组件
 * 包含 Logo、主导航、底部功能区（余额、插件、VIP、设置）、图标栏、用户头像/登录按钮
 * 支持展开/收缩两种状态
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSelectedLayoutSegments } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import { toast } from '@/lib/toast'
import { openLoginModal } from '@/store/loginModal'
import NotificationPanel from '@/components/notification/NotificationPanel'
import SettingsModal, { type SettingsTab } from '@/components/SettingsModal'
import AddAccountModal from '@/app/[lng]/accounts/components/AddAccountModal'
import { routerData } from '@/app/layout/routerData'
import {
  LogoSection,
  NavSection,
  BottomSection,
  IconBar,
  UserSection,
} from './components'
import { AffiliatesEntry } from './components/BottomSection/AffiliatesEntry'
import { useSettingsModalStore } from '@/components/SettingsModal/store'

// GitHub 配置
const GITHUB_REPO = 'yikart/AiToEarn'
const DOCS_URL = 'https://docs.aitoearn.ai'

/**
 * 外部链接组件 - Docs 和 GitHub
 */
function ExternalLinks({ collapsed }: { collapsed: boolean }) {
  const [starCount, setStarCount] = useState<string>('9.5k')

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then(res => res.json())
      .then(data => {
        if (data.stargazers_count) {
          const count = data.stargazers_count
          setStarCount(count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString())
        }
      })
      .catch(() => {})
  }, [])

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 pt-3 mt-2 border-t border-sidebar-border">
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
          title="Docs"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </a>
        <a
          href={`https://github.com/${GITHUB_REPO}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
          title={`GitHub Stars: ${starCount}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-3 pt-3 mt-2 border-t border-sidebar-border">
      <a
        href={DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 text-[11px] font-medium text-muted-foreground/80 hover:bg-accent hover:text-foreground hover:border-border transition-all"
      >
        <BookOpen className="w-3 h-3" />
        Docs
      </a>
      <a
        href={`https://github.com/${GITHUB_REPO}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-full border border-border/60 overflow-hidden hover:border-border transition-all"
      >
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground/80 hover:bg-accent hover:text-foreground transition-colors">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Star
        </span>
        <span className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground bg-accent/30 border-l border-border/60">
          {starCount}
        </span>
      </a>
    </div>
  )
}

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
          toast.success('Account added successfully')
        }}
        showSpaceSelector={true}
      />
    </>
  )
}

export default LayoutSidebar
