/**
 * MobileNav - 移动端顶部栏 + 底部导航 + 抽屉式侧边栏
 * 布局：顶部 Logo/头像常驻，底部 BottomBar 导航，抽屉承载完整导航和常用功能
 */
'use client'

import { Bell, Globe, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import { SITE_SWITCH_TRANSLATION_KEY, SITE_SWITCH_URL, useNavigationLogic } from '@/app/layout/shared'
import { useChannelManagerStore } from '@/components/ChannelManager'
import NotificationPanel from '@/components/notification/NotificationPanel'
import { useSettingsModalStore } from '@/components/SettingsModal/store'
import { Badge } from '@/components/ui/badge'
import { useNotification } from '@/hooks/useNotification'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import { MobileBottomBar, MobileNavList, MobileTopBar } from './components'
import { MobileUserSection } from './components/MobileUserSection'

function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [notificationVisible, setNotificationVisible] = useState(false)
  const { currRouter, isAuthPage, isBottomNavHidden } = useNavigationLogic()
  const { openSettings } = useSettingsModalStore()
  const { t } = useTransClient('common')
  const { unreadCount } = useNotification()

  const { token, logout } = useUserStore(
    useShallow(state => ({
      token: state.token,
      logout: state.logout,
    })),
  )

  // 频道管理器
  const { openModal } = useChannelManagerStore(
    useShallow(state => ({
      openModal: state.openModal,
    })),
  )

  // auth 页面不显示
  if (isAuthPage) {
    return null
  }

  const handleClose = () => setIsOpen(false)

  const handleLogout = () => {
    handleClose()
    logout()
  }

  const actionItemClassName = 'flex w-full items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-muted-foreground transition-all hover:bg-brand-cyan/10 hover:text-brand-cyan cursor-pointer'

  return (
    <>
      {/* 移动端顶部栏 */}
      <MobileTopBar onOpen={() => setIsOpen(true)} unreadCount={unreadCount} />

      {/* 移动端底部导航 */}
      <MobileBottomBar currentRoute={currRouter} hidden={isBottomNavHidden} />

      {/* 抽屉遮罩 */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-muted-foreground/45 transition-opacity"
          data-testid="mobile-drawer-overlay"
          onClick={handleClose}
        />
      )}

      {/* 抽屉导航 */}
      <div
        data-testid="mobile-drawer"
        className={cn(
          'md:hidden fixed top-0 right-0 z-500 w-75 h-full bg-background shadow-xl transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* 用户信息区域 */}
        <div className="shrink-0 border-b border-border">
          <MobileUserSection onClose={handleClose} onOpenSettings={openSettings} />
        </div>

        {/* 可滚动导航区域 */}
        <div className="flex-1 overflow-y-auto">
          <MobileNavList
            currentRoute={currRouter}
            onClose={handleClose}
            onOpenMyChannels={openModal}
          />

          {/* 常用功能区域 */}
          <div className="border-t border-border px-4 pb-4 pt-3 flex flex-col gap-1">
            {/* 站点切换 */}
            <a
              href={SITE_SWITCH_URL}
              className={actionItemClassName}
              data-testid="mobile-site-switch"
            >
              <span className="flex items-center justify-center">
                <Globe size={20} />
              </span>
              <span>{t(SITE_SWITCH_TRANSLATION_KEY)}</span>
            </a>

            {/* 设置 */}
            <button
              onClick={() => {
                handleClose()
                openSettings()
              }}
              className={actionItemClassName}
              data-testid="mobile-settings-btn"
            >
              <span className="flex items-center justify-center">
                <Settings size={20} />
              </span>
              <span>{t('settings')}</span>
            </button>

            {/* 消息通知 - 仅登录时显示 */}
            {token && (
              <button
                onClick={() => {
                  handleClose()
                  setNotificationVisible(true)
                }}
                className={actionItemClassName}
                data-testid="mobile-notification-btn"
              >
                <span className="flex items-center justify-center relative">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-2.5 -top-2 h-4 min-w-4 px-1 text-[9px] leading-4"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </span>
                <span>{t('notifications')}</span>
              </button>
            )}

            {/* 退出登录 - 仅登录时显示 */}
            {token && (
              <>
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={handleLogout}
                  className={actionItemClassName}
                  data-testid="mobile-logout-btn"
                >
                  <span className="flex items-center justify-center">
                    <LogOut size={20} />
                  </span>
                  <span>{t('logout')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 通知面板 */}
      <NotificationPanel
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />
    </>
  )
}

export default MobileNav
