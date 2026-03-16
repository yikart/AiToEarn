/**
 * NotificationItem - 单个通知项组件
 * 支持类型彩色图标、未读红点、DropdownMenu 操作菜单（标记已读/删除）
 */

import type { NotificationItem as INotificationItem } from '@/api/notification'
import {
  AlertTriangle,
  Bell,
  Bot,
  Check,
  CheckCircle,
  Clock,
  Image,
  Info,
  MoreHorizontal,
  Rocket,
  Trash2,
  User,
  Wallet,
  XCircle,
} from 'lucide-react'
import { memo, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const NOTIFICATION_TYPE_CONFIG: Record<string, {
  icon: React.ElementType
  iconClass: string
}> = {
  system: { icon: Bell, iconClass: 'text-foreground' },
  user: { icon: User, iconClass: 'text-info' },
  material: { icon: Image, iconClass: 'text-warning' },
  task_reminder: { icon: Clock, iconClass: 'text-warning' },
  app_release: { icon: Rocket, iconClass: 'text-success' },
  user_withdraw: { icon: Wallet, iconClass: 'text-success' },
  task_punish: { icon: AlertTriangle, iconClass: 'text-destructive' },
  agent_result: { icon: Bot, iconClass: 'text-info' },
  task_settled: { icon: CheckCircle, iconClass: 'text-success' },
  task_review_rejected: { icon: XCircle, iconClass: 'text-destructive' },
  task_review_approved: { icon: CheckCircle, iconClass: 'text-success' },
  ai_review_skipped: { icon: AlertTriangle, iconClass: 'text-warning' },
  task_submitted: { icon: CheckCircle, iconClass: 'text-info' },
  other: { icon: Info, iconClass: 'text-muted-foreground' },
}

interface NotificationItemProps {
  item: INotificationItem
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onClick: (item: INotificationItem) => void
}

function formatTime(timeString: string, t: (key: string, options?: Record<string, unknown>) => string) {
  const date = new Date(timeString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1)
    return t('time.justNow')
  if (minutes < 60)
    return t('time.minutesAgo', { minutes })
  if (hours < 24)
    return t('time.hoursAgo', { hours })
  if (days < 7)
    return t('time.daysAgo', { days })
  return date.toLocaleDateString()
}

const NotificationItem = memo(({ item, onMarkAsRead, onDelete, onClick }: NotificationItemProps) => {
  const { t } = useTransClient('notification' as any)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isUnread = item.status === 'unread'
  const typeText = t(`notificationTypes.${item.type}` as any) || item.type
  const config = NOTIFICATION_TYPE_CONFIG[item.type] || NOTIFICATION_TYPE_CONFIG.other
  const IconComponent = config.icon

  return (
    <>
      <div
        className={cn(
          'group relative flex gap-3 px-4 sm:px-5 py-3.5 transition-all duration-200 cursor-pointer',
          isUnread
            ? 'bg-primary/[0.03] hover:bg-muted/50'
            : 'bg-transparent hover:bg-muted/50',
        )}
        onClick={() => onClick(item)}
        data-testid="notification-item"
      >
        {/* 未读左侧竖线指示器 */}
        {isUnread && (
          <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-primary" />
        )}

        {/* 左侧类型图标 */}
        <div className="w-7 flex items-start justify-center pt-0.5 flex-shrink-0">
          <IconComponent className={cn('w-5 h-5', config.iconClass)} />
        </div>

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 标题 */}
          <h4 className={cn(
            'text-sm truncate mb-1',
            isUnread ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground',
          )}
          >
            {item.title}
          </h4>

          {/* 内容预览 */}
          <p className={cn(
            'text-[13px] leading-relaxed line-clamp-2 mb-2',
            isUnread ? 'text-muted-foreground' : 'text-muted-foreground/60',
          )}
          >
            {item.content}
          </p>

          {/* 元信息行：类型 · 时间 */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground/60">
              {typeText}
              {' '}
              ·
              {formatTime(item.createdAt, t)}
            </span>

            {/* DropdownMenu 触发按钮 */}
            <div onClick={e => e.stopPropagation()} data-testid="notification-item-menu">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 md:transition-opacity duration-200 max-md:opacity-40"
                  >
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  {isUnread && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={() => onMarkAsRead(item.id)}
                      data-testid="notification-item-mark-read"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {t('markAsRead')}
                    </DropdownMenuItem>
                  )}
                  {isUnread && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onSelect={() => setShowDeleteConfirm(true)}
                    data-testid="notification-item-delete"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* AlertDialog 放在 DropdownMenu 外部，受控模式 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent data-testid="notification-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="notification-delete-cancel-btn">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(item.id)}
              data-testid="notification-delete-confirm-btn"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})

NotificationItem.displayName = 'NotificationItem'

export default NotificationItem
