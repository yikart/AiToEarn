/**
 * Providers - 全局 Provider 组件
 * 包含 Google OAuth、Ant Design 配置、Toast、主题等全局配置
 */

'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useShallow } from 'zustand/shallow'
import { useTransClient } from '@/app/i18n/client'
import LoginDialog from '@/app/layout/LoginDialog'
import { useLoginDialogStore } from '@/app/layout/LoginDialog/store'
import SettingsModal from '@/components/SettingsModal'
import { useSettingsModalStore } from '@/components/SettingsModal/store'
import NotificationCenter from '@/components/ui/NotificationCenter'
import { Toaster } from '@/components/ui/sonner'
import { toast } from '@/lib/toast'
import { useUserStore } from '@/store/user'
import { isPublicPage } from '@/utils/route'

export function Providers({ children, lng, autoLoginToken }: { children: React.ReactNode, lng: string, autoLoginToken?: string }) {
  const pathname = usePathname()
  const manualLoginDisabled = Boolean(autoLoginToken)
  const { t, ready: isLoginI18nReady } = useTransClient('login')
  // 用于追踪是否已经在当前路由弹出过登录框，避免重复弹出
  const hasPromptedRef = useRef(false)

  const { _hasHydrated, token, isQueryTokenLoginPending } = useUserStore(
    useShallow(state => ({
      _hasHydrated: state._hasHydrated,
      token: state.token,
      isQueryTokenLoginPending: state.isQueryTokenLoginPending,
    })),
  )

  // 全局设置弹框状态
  const { settingsVisible, settingsDefaultTab, closeSettings } = useSettingsModalStore()
  const manualLoginDisabledNoticeSeq = useLoginDialogStore(state => state.manualLoginDisabledNoticeSeq)

  useLayoutEffect(() => {
    useLoginDialogStore.getState().setManualLoginDisabled(manualLoginDisabled)
  }, [manualLoginDisabled])

  useEffect(() => {
    if (manualLoginDisabledNoticeSeq === 0)
      return

    if (!isLoginI18nReady)
      return

    toast.info(t('manualLoginDisabledNotice'))
  }, [isLoginI18nReady, manualLoginDisabledNoticeSeq, t])

  useEffect(() => {
    if (!_hasHydrated)
      return

    const hasQueryToken = new URLSearchParams(window.location.search).has('token')

    // 自动登录：无 token 时使用环境变量注入的 token
    if (!hasQueryToken && !useUserStore.getState().token && autoLoginToken) {
      useUserStore.getState().setToken(autoLoginToken)
      useLoginDialogStore.getState().closeLoginDialog()
      hasPromptedRef.current = false
    }

    useUserStore.getState().appInit()
  }, [_hasHydrated, autoLoginToken])

  useEffect(() => {
    useUserStore.getState().setLang(lng)
  }, [lng])

  // 未登录用户访问非公开页面时，跳转到登录页
  useEffect(() => {
    // 等待持久化数据同步完成
    if (!_hasHydrated) {
      return
    }

    const hasQueryToken = new URLSearchParams(window.location.search).has('token')
    if (isQueryTokenLoginPending || hasQueryToken) {
      return
    }

    const currentToken = token || useUserStore.getState().token

    // 已登录用户不需要跳转
    if (currentToken) {
      hasPromptedRef.current = false
      useLoginDialogStore.getState().closeLoginDialog()
      return
    }

    // 公开页面不需要跳转
    if (isPublicPage(pathname)) {
      hasPromptedRef.current = false
      return
    }

    if (manualLoginDisabled) {
      if (!hasPromptedRef.current) {
        hasPromptedRef.current = true
        useLoginDialogStore.getState().requestManualLoginDisabledNotice()
      }
      return
    }

    // 避免重复跳转
    if (hasPromptedRef.current) {
      return
    }

    // 在当前页面弹出登录框，不跳转
    hasPromptedRef.current = true
    useLoginDialogStore.getState().openLoginDialog({ fromGuard: true })
  }, [_hasHydrated, isQueryTokenLoginPending, token, pathname, manualLoginDisabled])

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
          <Toaster position="top-center" richColors />
          {/* 专用右上角通知中心（不影响现有 toast） */}
          <NotificationCenter />
          {/* 全局登录弹框 */}
          <LoginDialog manualLoginDisabled={manualLoginDisabled} />
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
