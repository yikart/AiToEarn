/**
 * Providers - 全局 Provider 组件
 * 包含 Google OAuth、Ant Design 配置、Toast、主题等全局配置
 */

'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import ConfigManagerDialog from '@/app/layout/ConfigManagerDialog'
import LoginDialog from '@/app/layout/LoginDialog'
import SettingsModal from '@/app/layout/SettingsModal'
import { isPublicPage } from '@/app/layout/shared/utils/routeUtils'
import { WechatBrowserOverlay } from '@/components/common/WechatBrowserOverlay'
import { PluginPublishingFloatButton } from '@/components/Plugin'
import NotificationCenter from '@/components/ui/NotificationCenter'
import { Toaster } from '@/components/ui/sonner'
import { useConfigManagerDialogStore } from '@/store/configManagerDialog'
import { useLoginDialogStore } from '@/store/login-dialog'
import { usePlatformMetadataStore } from '@/store/platformMetadata'
import { useSettingsModalStore } from '@/store/settingsModal'
import { useUserStore } from '@/store/user'

const PublicRouteContext = createContext(false)

export function usePublicRoute() {
  return useContext(PublicRouteContext)
}

export function Providers({
  children,
  lng,
  autoLoginToken,
}: {
  children: React.ReactNode
  lng: string
  autoLoginToken?: string
}) {
  const pathname = usePathname()
  const publicRoute = isPublicPage(pathname)
  // 用于追踪是否已经在当前路由弹出过登录框，避免重复弹出
  const hasPromptedRef = useRef(false)
  const [authInitialized, setAuthInitialized] = useState(false)

  const { _hasHydrated, token } = useUserStore(
    useShallow(state => ({
      _hasHydrated: state._hasHydrated,
      token: state.token,
    })),
  )

  useEffect(() => {
    if (usePlatformMetadataStore.getState().loadedLng === lng)
      return
    usePlatformMetadataStore.getState().ensureLoaded(lng)
  }, [lng])

  // 全局设置弹框状态
  const { settingsVisible, settingsDefaultTab, closeSettings } = useSettingsModalStore()
  const { open: configManagerOpen, closeDialog: closeConfigManagerDialog } = useConfigManagerDialogStore()

  useEffect(() => {
    if (!_hasHydrated) {
      return
    }

    useUserStore.getState().appInit(autoLoginToken)
    setAuthInitialized(true)
  }, [_hasHydrated, autoLoginToken])

  useEffect(() => {
    useUserStore.getState().setLang(lng)
  }, [lng])

  // 未登录用户访问非公开页面时，跳转到登录页
  useEffect(() => {
    // 等待持久化数据同步完成
    if (!_hasHydrated || !authInitialized) {
      return
    }

    // 已登录用户不需要跳转
    if (token) {
      hasPromptedRef.current = false
      return
    }

    // 公开页面不需要跳转
    if (publicRoute) {
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
  }, [_hasHydrated, authInitialized, token, pathname, publicRoute])

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
    <PublicRouteContext.Provider value={publicRoute}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <GoogleOAuthProvider clientId="1094109734611-flskoscgp609mecqk9ablvc6i3205vqk.apps.googleusercontent.com">
          <Toaster position="top-center" richColors />
          {/* 专用右上角通知中心（不影响现有 toast） */}
          <NotificationCenter />
          <PluginPublishingFloatButton />
          <WechatBrowserOverlay />
          {/* 全局登录弹框 */}
          <LoginDialog />
          {/* 全局配置管理弹框 */}
          <ConfigManagerDialog open={configManagerOpen} onClose={closeConfigManagerDialog} />
          {/* 全局设置弹框 - 统一在此渲染，避免多处重复 */}
          <SettingsModal
            open={settingsVisible}
            onClose={closeSettings}
            defaultTab={settingsDefaultTab}
          />
          {children}
        </GoogleOAuthProvider>
      </ThemeProvider>
    </PublicRouteContext.Provider>
  )
}
