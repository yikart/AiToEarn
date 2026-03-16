/**
 * MobileNav - 移动端顶部导航组件
 * 在移动端显示，包含 Logo 和抽屉式导航菜单
 * 与桌面端侧边栏功能保持一致
 */
'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useNavigationLogic } from '@/app/layout/shared'
import { useChannelManagerStore } from '@/components/ChannelManager'
import { useSettingsModalStore } from '@/components/SettingsModal/store'
import { cn } from '@/lib/utils'
import { MobileBottomSection, MobileNavList, MobileTopBar } from './components'

/**
 * 移动端导航主组件
 */
function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { currRouter, isAuthPage } = useNavigationLogic()
  const { openSettings } = useSettingsModalStore()

  // 频道管理器
  const { openModal } = useChannelManagerStore(
    useShallow(state => ({
      openModal: state.openModal,
    })),
  )

  // 首页、auth、websit、welcome 页面不显示侧边栏
  if (isAuthPage) {
    return null
  }

  const handleClose = () => setIsOpen(false)

  return (
    <>
      {/* 移动端顶部栏 */}
      <MobileTopBar onOpen={() => setIsOpen(true)} />

      {/* 抽屉遮罩 */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 transition-opacity"
          data-testid="mobile-drawer-overlay"
          onClick={handleClose}
        />
      )}

      {/* 抽屉导航 */}
      <div
        data-testid="mobile-drawer"
        className={cn(
          'md:hidden fixed top-0 right-0 z-500 w-[300px] h-full bg-background shadow-xl transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* 抽屉头部 */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
          <span className="text-base font-semibold text-foreground">Menu</span>
          <button
            onClick={handleClose}
            data-testid="mobile-drawer-close"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* 可滚动导航区域 */}
        <div className="flex-1 overflow-y-auto">
          <MobileNavList
            currentRoute={currRouter}
            onClose={handleClose}
            onOpenMyChannels={openModal}
          />
        </div>

        {/* 底部功能区 - 固定在底部 */}
        <div className="shrink-0 px-4 pb-4 border-t border-border">
          <MobileBottomSection onClose={handleClose} onOpenSettings={openSettings} />
        </div>
      </div>
    </>
  )
}

export default MobileNav
