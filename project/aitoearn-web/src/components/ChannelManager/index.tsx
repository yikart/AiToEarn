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

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useShallow } from 'zustand/react/shallow'
import { useTransClient } from '@/app/i18n/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useChannelManagerStore } from './channelManagerStore'
import { AuthLoadingPage } from './components/AuthLoadingPage'
import { ConnectChannelList } from './components/ConnectChannelList'
import { MainPage } from './components/MainPage'

export function ChannelManager() {
  const { t } = useTransClient('account')

  const {
    open,
    currentView,
    pendingPluginAccountConfirm,
    closeModal,
    confirmPluginAccountSync,
    rejectPluginAccountSync,
  } = useChannelManagerStore(
    useShallow(state => ({
      open: state.open,
      currentView: state.currentView,
      pendingPluginAccountConfirm: state.pendingPluginAccountConfirm,
      closeModal: state.closeModal,
      confirmPluginAccountSync: state.confirmPluginAccountSync,
      rejectPluginAccountSync: state.rejectPluginAccountSync,
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
    <>
      <Dialog open={open} onOpenChange={closeModal}>
        <DialogContent data-testid="channel-manager-dialog" className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col overflow-hidden p-0 md:h-[700px] md:max-h-[700px] md:max-w-5xl md:rounded-lg">
          {/* Header - 只在主页和连接列表页显示，auth-loading 时用 VisuallyHidden 保留无障碍标题 */}
          {currentView !== 'auth-loading' ? (
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle className="text-lg font-semibold">{getTitle()}</DialogTitle>
            </DialogHeader>
          ) : (
            <VisuallyHidden>
              <DialogTitle>{getTitle()}</DialogTitle>
            </VisuallyHidden>
          )}

          {/* 内容区域 */}
          <div className="min-h-0 flex-1">{renderView()}</div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingPluginAccountConfirm)}
        onOpenChange={(isOpen) => {
          if (!isOpen)
            rejectPluginAccountSync()
        }}
      >
        <AlertDialogContent data-testid="cm-plugin-account-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>确认频道账号</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPluginAccountConfirm
                ? `检测到${pendingPluginAccountConfirm.platformName}账号：${pendingPluginAccountConfirm.accountName}。确认这是你的账号后再同步到频道管理。`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cm-plugin-account-reject-btn">不是我的账号</AlertDialogCancel>
            <AlertDialogAction
              data-testid="cm-plugin-account-confirm-btn"
              onClick={(event) => {
                event.preventDefault()
                confirmPluginAccountSync()
              }}
            >
              确认同步
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// 导出store hook
export { useChannelManagerStore } from './channelManagerStore'

// 导出类型
export * from './types'

// 默认导出
export default ChannelManager
