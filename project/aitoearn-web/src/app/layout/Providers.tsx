/**
 * Providers - 全局 Provider 组件
 * 包含 Google OAuth、Ant Design 配置、Toast、主题等全局配置
 */

'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from 'next-themes'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useShallow } from 'zustand/shallow'
import LoginDialog from '@/app/layout/LoginDialog'
import { useLoginDialogStore } from '@/app/layout/LoginDialog/store'
import { InviteCodeHandler } from '@/components/InviteCodeHandler'
import SettingsModal from '@/components/SettingsModal'
import { useSettingsModalStore } from '@/components/SettingsModal/store'
import NotificationCenter from '@/components/ui/NotificationCenter'
import { Toaster } from '@/components/ui/sonner'
import { useUserStore } from '@/store/user'
import { isPublicPage } from '@/utils/route'

export function Providers({ children, lng }: { children: React.ReactNode, lng: string }) {
  const pathname = usePathname()
  const router = useRouter()
  // 用于追踪是否已经在当前路由弹出过登录框，避免重复弹出
  const hasPromptedRef = useRef(false)

  const { _hasHydrated, token, _appInitialized } = useUserStore(
    useShallow(state => ({
      _hasHydrated: state._hasHydrated,
      token: state.token,
      _appInitialized: state._appInitialized,
    })),
  )

  // 全局设置弹框状态
  const { settingsVisible, settingsDefaultTab, closeSettings } = useSettingsModalStore()

  useEffect(() => {
    if (_hasHydrated) {
      useUserStore.getState().appInit()
    }
  }, [_hasHydrated])

  useEffect(() => {
    useUserStore.getState().setLang(lng)
  }, [lng])

  // 未登录用户访问非公开页面时，跳转到登录页
  useEffect(() => {
    // 等待持久化数据同步完成和 appInit 完成（含自动登录）
    if (!_hasHydrated || !_appInitialized) {
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
  }, [_hasHydrated, _appInitialized, token, pathname])

  // 拦截 @react-oauth/google 的脚本加载，添加 ?hl= 参数以设置按钮语言
  useLayoutEffect(() => {
    const hl = lng.replace('-', '_')
    const GIS_URL = 'https://accounts.google.com/gsi/client'
    const originalAppendChild = document.body.appendChild.bind(document.body)

    document.body.appendChild = function <T extends Node>(node: T): T {
      if (node instanceof HTMLScriptElement && node.src === GIS_URL) {
        node.src = `${GIS_URL}?hl=${hl}`
      }
      return originalAppendChild(node)
    }

    return () => {
      document.body.appendChild = originalAppendChild
    }
  }, [lng])

  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <GoogleOAuthProvider clientId="1094109734611-flskoscgp609mecqk9ablvc6i3205vqk.apps.googleusercontent.com">
          {/* 邀请码处理 - 检测 URL 中的 ref 参数并绑定邀请关系 */}
          <InviteCodeHandler />
          <Toaster position="top-center" richColors />
          {/* 专用右上角通知中心（不影响现有 toast） */}
          <NotificationCenter />
          {/* 全局登录弹框 */}
          <LoginDialog />
          {/* 全局设置弹框 - 统一在此渲染，避免多处重复 */}
          <SettingsModal
            open={settingsVisible}
            onClose={closeSettings}
            defaultTab={settingsDefaultTab}
          />
          {children}
        </GoogleOAuthProvider>
      </ThemeProvider>
    </>
  )
}
