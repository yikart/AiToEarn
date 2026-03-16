import type { MobileBottomSectionProps } from '../types'
/**
 * MobileBottomSection - 移动端底部功能区
 * 包含通知、邮箱联系、外部链接和用户区域
 */
import {
  Bell,
  Mail,
} from 'lucide-react'
import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { ExternalLinks } from '@/app/layout/shared'
import NotificationPanel from '@/components/notification/NotificationPanel'
import { Badge } from '@/components/ui/badge'
import { CONTACT } from '@/constant'
import { useNotification } from '@/hooks/useNotification'
import { useUserStore } from '@/store/user'
import { MobileUserSection } from './MobileUserSection'

export function MobileBottomSection({
  onClose,
  onOpenSettings,
}: MobileBottomSectionProps) {
  const { t } = useTransClient(['common'])
  const token = useUserStore(state => state.token)
  const { unreadCount } = useNotification()

  const [notificationVisible, setNotificationVisible] = useState(false)

  return (
    <>
      {/* 图标栏 */}
      <div className="flex items-center justify-center gap-4 border-t border-border py-3 mt-2">
        {/* 邮箱 - 联系我们 */}
        <a
          href={`mailto:${CONTACT}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          data-testid="mobile-contact-link"
          title={`${t('common:contactUs')}: ${CONTACT}`}
        >
          <Mail size={20} />
        </a>

        {/* 通知 - 仅登录后显示 */}
        {token && (
          <button
            onClick={() => {
              onClose()
              setNotificationVisible(true)
            }}
            data-testid="mobile-notification-btn"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors relative cursor-pointer"
            title={t('common:notifications')}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                data-testid="mobile-notification-badge"
                className="absolute -right-1 -top-1 h-[18px] min-w-[18px] px-1 text-[10px] leading-[18px]"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </button>
        )}
      </div>

      {/* 外部链接 - Docs 和 GitHub */}
      <ExternalLinks isMobile />

      {/* 用户区域 */}
      <div className="border-t border-border pt-3 px-4">
        <MobileUserSection onClose={onClose} onOpenSettings={onOpenSettings} />
      </div>

      {/* 弹窗 */}
      <NotificationPanel
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />
    </>
  )
}
