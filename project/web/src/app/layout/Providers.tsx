'use client'

import type { Locale } from 'antd/es/locale'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { App, ConfigProvider, message, Modal, notification } from 'antd'
import en_US from 'antd/es/locale/en_US'
import zh_CN from 'antd/es/locale/zh_CN'
import { Suspense, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDataStatisticsStore } from '@/app/[lng]/dataStatistics/useDataStatistics'
import useCssVariables from '@/app/hooks/useCssVariables'
import { fallbackLng } from '@/app/i18n/settings'
import { useAccountStore } from '@/store/account'
import { useConfigStore } from '@/store/config'
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
  const { setGlobal } = useConfigStore(
    useShallow(state => ({
      setGlobal: state.setGlobal,
    })),
  )
  const [notificationApi, contextHolderNotification]
    = notification.useNotification()
  const [messageApi, contextHolderMessage] = message.useMessage()
  const [modal, contextHolderModal] = Modal.useModal()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const queryToken = urlParams.get('token')
    if (queryToken) {
      useUserStore.getState().setToken(queryToken)
    }
    if (useUserStore.getState().token) {
      useDataStatisticsStore.getState().init()
      useUserStore.getState().getUserInfo()
      useAccountStore.getState().accountInit()
    }

    setGlobal(modal, notificationApi, messageApi)
  }, [])

  useEffect(() => {
    useUserStore.getState().setLang(lng)
  }, [lng])

  return (
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
              {contextHolderNotification}
              {contextHolderMessage}
              {contextHolderModal}
              {children}
            </AntdRegistry>
          </Suspense>
        </App>
      </ConfigProvider>
    </GoogleOAuthProvider>
  )
}
