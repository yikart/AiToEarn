/**
 * NotificationPanel - 通知面板
 * 主面板组件，包含头部（Bell图标+标题+未读数+全部已读+设置）、任务中心入口、虚拟列表
 */

'use client'

import { Bell, CheckCheck, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { useTransClient } from '@/app/i18n/client'
import NotificationControlModal from '@/components/notification/NotificationControlModal'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/lib/toast'
import { useNotificationStore } from '@/store/notification'
import { useUserStore } from '@/store/user'
import NotificationList from './NotificationList'

interface NotificationPanelProps {
  visible: boolean
  onClose: () => void
}

function NotificationPanelContent({ onClose }: { onClose: () => void }) {
  const { t } = useTransClient('notification' as any)
  const router = useRouter()
  const token = useUserStore(state => state.token)
  const [controlModalVisible, setControlModalVisible] = useState(false)

  const { unreadCount, resetAndFetch, markAllAsRead } = useNotificationStore(
    useShallow(state => ({
      unreadCount: state.unreadCount,
      resetAndFetch: state.resetAndFetch,
      markAllAsRead: state.markAllAsRead,
    })),
  )

  useEffect(() => {
    if (token) {
      resetAndFetch()
    }
  }, [token, resetAndFetch])

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success(t('markAllSuccess'))
    }
    catch {
      toast.error(t('markFailed'))
    }
  }

  return (
    <>
      {/* 头部 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0" data-testid="notification-panel">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="w-[18px] h-[18px] text-primary" />
          </div>
          <span className="text-base font-semibold text-foreground">{t('title')}</span>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 text-[11px] font-medium leading-5 text-center text-destructive-foreground bg-destructive rounded-full" data-testid="notification-unread-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs cursor-pointer hover:bg-accent rounded-full"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            data-testid="notification-mark-all-read"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            {t('markAllAsRead')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer hover:bg-accent rounded-full"
            onClick={() => setControlModalVisible(true)}
            title={t('editControl')}
            data-testid="notification-settings-btn"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 通知列表 */}
      <NotificationList onClose={onClose} />

      {/* 通知设置弹窗 */}
      <NotificationControlModal
        visible={controlModalVisible}
        onClose={() => setControlModalVisible(false)}
      />
    </>
  )
}

function NotificationPanel({ visible, onClose }: NotificationPanelProps) {
  if (!visible)
    return null

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={600}
      footer={null}
      bodyClassName="!overflow-hidden !p-0 !mx-0"
      title={null}
    >
      <NotificationPanelContent onClose={onClose} />
    </Modal>
  )
}

export default NotificationPanel
