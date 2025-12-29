/**
 * Providers - 全局 Provider 组件
 * 包含 Google OAuth、Ant Design 配置、Toast、主题等全局配置
 */

'use client'

import type { Locale } from 'antd/es/locale'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { App, ConfigProvider } from 'antd'
import en_US from 'antd/es/locale/en_US'
import zh_CN from 'antd/es/locale/zh_CN'
import { ThemeProvider } from 'next-themes'
import { Suspense, useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import { useDataStatisticsStore } from '@/app/[lng]/dataStatistics/useDataStatistics'
import useCssVariables from '@/app/hooks/useCssVariables'
import { fallbackLng } from '@/app/i18n/settings'
import { GlobalLoginModal } from '@/components/common/GlobalLoginModal'
import NotificationCenter from '@/components/ui/NotificationCenter'
import { Toaster } from '@/components/ui/sonner'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'

// antd 语言获取
function getAntdLang(lang: string): Locale {
  switch (lang) {
    case 'zh-CN':
      return zh_CN
    case 'en':
      return en_US
  }
  return getAntdLang(fallbackLng)
}

export function Providers({
  children,
  lng,
}: {
  children: React.ReactNode
  lng: string
}) {
  const cssVariables = useCssVariables()
  const { _hasHydrated } = useUserStore(
    useShallow(state => ({
      _hasHydrated: state._hasHydrated,
    })),
  )

  useEffect(() => {
    if (_hasHydrated) {
      const urlParams = new URLSearchParams(window.location.search)
      const queryToken = urlParams.get('token')
      if (queryToken) {
        useUserStore.getState().setToken(queryToken)
      }
      useUserStore.getState().appInit()
    }
  }, [_hasHydrated])

  useEffect(() => {
    useUserStore.getState().setLang(lng)
  }, [lng])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <GoogleOAuthProvider clientId="1094109734611-flskoscgp609mecqk9ablvc6i3205vqk.apps.googleusercontent.com">
        <ConfigProvider
          locale={getAntdLang(lng)}
          theme={{
            token: {
              colorPrimary: cssVariables['--theColor5'],
            },
          }}
        >
          <App component={false}>
            <Suspense>
              <AntdRegistry>
                <Toaster position="top-center" richColors />
                {/* 专用右上角通知中心（不影响现有 toast） */}
                <NotificationCenter />
                <GlobalLoginModal />
                {children}
              </AntdRegistry>
            </Suspense>
          </App>
        </ConfigProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  )
}
