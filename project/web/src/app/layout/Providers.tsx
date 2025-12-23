/**
 * Providers - 全局 Provider 组件
 * 包含 Google OAuth、Ant Design 配置、Toast、主题等全局配置
 */

'use client'

import type { Locale } from 'antd/es/locale'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from 'next-themes'
import { App, ConfigProvider } from 'antd'
import en_US from 'antd/es/locale/en_US'
import zh_CN from 'antd/es/locale/zh_CN'
import { Suspense, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { GlobalLoginModal } from '@/components/common/GlobalLoginModal'
import { useDataStatisticsStore } from '@/app/[lng]/dataStatistics/useDataStatistics'
import useCssVariables from '@/app/hooks/useCssVariables'
import { fallbackLng } from '@/app/i18n/settings'
import { useAccountStore } from '@/store/account'
import { useUserStore } from '@/store/user'
import { useShallow } from 'zustand/shallow'

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
  const {
    token,
  } = useUserStore(
    useShallow(state => ({
      token: state.token,
    })),
  )

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const queryToken = urlParams.get('token')
    if (queryToken) {
      useUserStore.getState().setToken(queryToken)
    }
    if (token) {
      useDataStatisticsStore.getState().init()
      useUserStore.getState().getUserInfo()
      useAccountStore.getState().accountInit()
    }
  }, [token])

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
