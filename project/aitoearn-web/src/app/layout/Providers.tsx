/**
 * Providers - 全局 Provider 组件
 * 包含 Ant Design 配置、Toast、主题等全局配置
 */

'use client'

import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/shallow'
import LoginDialog from '@/app/layout/LoginDialog'
import { useLoginDialogStore } from '@/app/layout/LoginDialog/store'
import { LowBalanceAlertProvider } from '@/components/common/LowBalanceAlert/LowBalanceAlertProvider'
import SettingsModal from '@/components/SettingsModal'
import { useSettingsModalStore } from '@/components/SettingsModal/store'
import NotificationCenter from '@/components/ui/NotificationCenter'
import { Toaster } from '@/components/ui/sonner'
import { useUserStore } from '@/store/user'
import { isPublicPage } from '@/utils/route'

export function Providers({ children, lng }: { children: React.ReactNode, lng: string }) {
  const pathname = usePathname()
  // 用于追踪是否已经在当前路由弹出过登录框，避免重复弹出
  const hasPromptedRef = useRef(false)

  const { _hasHydrated, token } = useUserStore(
    useShallow(state => ({
      _hasHydrated: state._hasHydrated,
      token: state.token,
    })),
  )

  // 全局设置弹框状态
  const { settingsVisible, settingsDefaultTab, closeSettings } = useSettingsModalStore()

  useEffect(() => {
    if (!_hasHydrated)
      return
    useUserStore.getState().appInit()
  }, [_hasHydrated])

  useEffect(() => {
    useUserStore.getState().setLang(lng)
  }, [lng])

  // 未登录用户访问非公开页面时，跳转到登录页
  useEffect(() => {
    // 等待持久化数据同步完成
    if (!_hasHydrated) {
      return
    }

    // 已登录用户不需要跳转
    if (token) {
      hasPromptedRef.current = false
      return
    }

    // 公开页面不需要跳转
    if (isPublicPage(pathname)) {
      hasPromptedRef.current = false
      return
    }

    // 避免重复跳转
    if (hasPromptedRef.current) {
      return
    }

    // 在当前页面弹出登录框，不跳转
    hasPromptedRef.current = true
    useLoginDialogStore.getState().openLoginDialog({ fromGuard: true })
  }, [_hasHydrated, token, pathname])

  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <Toaster position="top-center" richColors />
        {/* 专用右上角通知中心（不影响现有 toast） */}
        <NotificationCenter />
        <LowBalanceAlertProvider />
        {/* 全局登录弹框 */}
        <LoginDialog />
        {/* 全局设置弹框 - 统一在此渲染，避免多处重复 */}
        <SettingsModal
          open={settingsVisible}
          onClose={closeSettings}
          defaultTab={settingsDefaultTab}
        />
        {children}
      </ThemeProvider>
    </>
  )
}
