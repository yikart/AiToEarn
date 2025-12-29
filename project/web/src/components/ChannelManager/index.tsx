/**
 * ChannelManager - 频道管理弹窗组件
 *
 * 功能描述：
 * - 三页面视图：主页、连接频道列表、授权loading页
 * - 左侧频道类型侧边栏 + 右侧空间和账号管理
 * - 支持外部调用 openModal、openAndAuth 等方法
 * - 全局单例，挂载在根布局
 */

'use client'

import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useChannelManagerStore } from './channelManagerStore'
import { AuthLoadingPage } from './components/AuthLoadingPage'
import { ConnectChannelList } from './components/ConnectChannelList'
import { MainPage } from './components/MainPage'

export function ChannelManager() {
  const { t } = useTransClient('account')

  const { open, currentView, closeModal } = useChannelManagerStore(
    useShallow(state => ({
      open: state.open,
      currentView: state.currentView,
      closeModal: state.closeModal,
    })),
  )

  // 根据当前视图获取标题
  const getTitle = () => {
    switch (currentView) {
      case 'connect-list':
        return t('channelManager.connectNewChannel')
      case 'auth-loading':
        return t('channelManager.authInProgress')
      default:
        return t('channelManager.title')
    }
  }

  // 渲染当前视图
  const renderView = () => {
    switch (currentView) {
      case 'connect-list':
        return <ConnectChannelList />
      case 'auth-loading':
        return <AuthLoadingPage />
      default:
        return <MainPage />
    }
  }

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col overflow-hidden p-0 md:h-[700px] md:max-h-[700px] md:max-w-5xl md:rounded-lg">
        {/* Header - 只在主页和连接列表页显示 */}
        {currentView !== 'auth-loading' && (
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-lg font-semibold">
              {getTitle()}
            </DialogTitle>
          </DialogHeader>
        )}

        {/* 内容区域 */}
        <div className="min-h-0 flex-1">
          {renderView()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 导出store hook
export { useChannelManagerStore } from './channelManagerStore'

// 导出类型
export * from './types'

// 默认导出
export default ChannelManager
