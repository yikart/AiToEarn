/**
 * NotificationList - 虚拟列表 + 无限滚动
 * 使用 @tanstack/react-virtual 实现虚拟列表
 * 使用 IntersectionObserver 触发加载更多
 */

'use client'

import type { NotificationItem as INotificationItem } from '@/api/notification'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Bell, Loader2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { useSettingsModalStore } from '@/components/SettingsModal/store'
import { toast } from '@/lib/toast'
import { useNotificationStore } from '@/store/notification'
import NotificationItem from './NotificationItem'
import NotificationSkeleton from './NotificationSkeleton'

interface NotificationListProps {
  onClose: () => void
}

export default function NotificationList({ onClose }: NotificationListProps) {
  const { t } = useTransClient('notification' as any)
  const router = useRouter()

  const {
    notifications,
    loading,
    loadingMore,
    pagination,
    loadMore,
    markAsRead,
    deleteNotification,
  } = useNotificationStore()

  const parentRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 虚拟列表
  const virtualizer = useVirtualizer({
    count: notifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  // IntersectionObserver 加载更多
  useEffect(() => {
    const sentinel = loadMoreRef.current
    const root = parentRef.current
    if (!sentinel || !root)
      return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && pagination.hasMore && !loadingMore && !loading) {
          loadMore()
        }
      },
      { root, threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [pagination.hasMore, loadingMore, loading, loadMore])

  // 标记已读
  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id)
      toast.success(t('markSuccess'))
    }
    catch {
      toast.error(t('markFailed'))
    }
  }, [markAsRead, t])

  // 删除通知
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteNotification(id)
      toast.success(t('deleteSuccess'))
    }
    catch {
      toast.error(t('deleteFailed'))
    }
  }, [deleteNotification, t])

  // 点击通知
  const handleClick = useCallback(async (item: INotificationItem) => {
    // 标记为已读
    if (item.status === 'unread') {
      markAsRead(item.id)
    }

    // 任务提醒跳转
    if (item.type === 'task_reminder' && item.relatedId) {
      onClose()
      router.push(`/tasks?taskId=${item.relatedId}`)
      return
    }

    // 任务结算完成 → 已接任务详情
    if (item.type === 'task_settled' && item.relatedId) {
      onClose()
      router.push(`/my-tasks/accepted/${item.relatedId}`)
      return
    }

    // 任务审核拒绝 → 已接任务详情
    if (item.type === 'task_review_rejected' && item.relatedId) {
      onClose()
      router.push(`/my-tasks/accepted/${item.relatedId}`)
      return
    }

    // 任务审核通过 → 已接任务详情
    if (item.type === 'task_review_approved' && item.relatedId) {
      onClose()
      router.push(`/my-tasks/accepted/${item.relatedId}`)
      return
    }

    // AI审核跳过 → 已发布任务详情
    if (item.type === 'ai_review_skipped' && item.relatedId) {
      onClose()
      router.push(`/my-tasks/published/${item.relatedId}`)
      return
    }

    // 新任务提交 → 已发布任务详情
    if (item.type === 'task_submitted' && item.relatedId) {
      onClose()
      router.push(`/my-tasks/published/${item.relatedId}`)
      return
    }

    // 互动任务AI审核失败 → 已发布任务详情
    if (item.type === 'interaction_ai_review_failed' && item.relatedId) {
      onClose()
      router.push(`/my-tasks/published/${item.relatedId}`)
      return
    }

    // Agent结果 → 聊天页
    if (item.type === 'agent_result' && item.relatedId) {
      onClose()
      router.push(`/chat/${item.relatedId}`)
      return
    }

    // 提现通知 → 设置-个人资料Tab
    if (item.type === 'user_withdraw') {
      onClose()
      useSettingsModalStore.getState().openSettings('profile')
    }
  }, [markAsRead, onClose, router])

  // 初始加载
  if (loading) {
    return <NotificationSkeleton />
  }

  // 空状态
  if (!loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" data-testid="notification-empty-state">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
            <Bell className="w-9 h-9 text-muted-foreground/40" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm text-muted-foreground">{t('noNotifications')}</p>
          <p className="text-xs text-muted-foreground/60 max-w-[200px]">{t('noNotificationsHint')}</p>
        </div>
      </div>
    )
  }

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className="h-[60vh] overflow-y-auto" data-testid="notification-list">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualRow) => {
          const item = notifications[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full border-b border-border/30"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <NotificationItem
                item={item}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClick={handleClick}
              />
            </div>
          )
        })}
      </div>

      {/* 哨兵元素：触发加载更多 */}
      <div ref={loadMoreRef} className="h-1" />

      {/* 加载更多指示器 */}
      {loadingMore && (
        <div className="flex items-center justify-center gap-2 py-4" data-testid="notification-loading-more">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{t('loadingMore')}</span>
        </div>
      )}

      {/* 到底提示 — 分隔线+中间文字 */}
      {!pagination.hasMore && notifications.length > 0 && (
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="flex-1 border-t border-border/30" />
          <span className="text-xs text-muted-foreground/50 whitespace-nowrap">{t('noMore')}</span>
          <div className="flex-1 border-t border-border/30" />
        </div>
      )}
    </div>
  )
}
