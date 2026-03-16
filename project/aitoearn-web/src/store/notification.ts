/**
 * notification - 通知状态管理
 * 管理通知列表、未读数、无限滚动分页、乐观更新
 */

import type { NotificationItem } from '@/api/notification'
import { create } from 'zustand'
import {
  deleteNotifications,
  getNotificationList,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/api/notification'

interface NotificationPagination {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface INotificationStore {
  notifications: NotificationItem[]
  loading: boolean
  loadingMore: boolean
  unreadCount: number
  pagination: NotificationPagination

  resetAndFetch: () => Promise<void>
  loadMore: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  reset: () => void
}

const initialPagination: NotificationPagination = {
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: true,
}

export const useNotificationStore = create<INotificationStore>((set, get) => ({
  notifications: [],
  loading: false,
  loadingMore: false,
  unreadCount: 0,
  pagination: { ...initialPagination },

  resetAndFetch: async () => {
    set({ loading: true, notifications: [], pagination: { ...initialPagination } })
    try {
      const [listRes, countRes] = await Promise.all([
        getNotificationList({ page: 1, pageSize: 20 }),
        getUnreadCount(),
      ])
      const list = listRes?.data?.list || []
      const total = listRes?.data?.total || 0
      const unreadCount = countRes?.data?.count || 0
      set({
        notifications: list,
        unreadCount,
        pagination: {
          page: 1,
          pageSize: 20,
          total,
          hasMore: list.length < total,
        },
      })
    }
    catch {
      // 错误由调用方处理
    }
    finally {
      set({ loading: false })
    }
  },

  loadMore: async () => {
    const { pagination, loadingMore, loading } = get()
    if (loadingMore || loading || !pagination.hasMore)
      return

    const nextPage = pagination.page + 1
    set({ loadingMore: true })
    try {
      const res = await getNotificationList({ page: nextPage, pageSize: pagination.pageSize })
      const newList = res?.data?.list || []
      const total = res?.data?.total || 0
      set(state => ({
        notifications: [...state.notifications, ...newList],
        pagination: {
          ...state.pagination,
          page: nextPage,
          total,
          hasMore: state.notifications.length + newList.length < total,
        },
      }))
    }
    catch {
      // 静默处理
    }
    finally {
      set({ loadingMore: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await getUnreadCount()
      if (res?.data) {
        set({ unreadCount: res.data.count || 0 })
      }
    }
    catch {
      // 静默处理
    }
  },

  markAsRead: async (id: string) => {
    const { notifications, unreadCount } = get()
    const target = notifications.find(n => n.id === id)
    if (!target || target.status === 'read')
      return

    // 乐观更新
    set({
      notifications: notifications.map(n =>
        n.id === id ? { ...n, status: 'read' as const } : n,
      ),
      unreadCount: Math.max(0, unreadCount - 1),
    })

    try {
      await markNotificationAsRead([id])
    }
    catch {
      // 回滚
      set({
        notifications: notifications.map(n =>
          n.id === id ? { ...n, status: 'unread' as const } : n,
        ),
        unreadCount,
      })
    }
  },

  markAllAsRead: async () => {
    const { notifications, unreadCount } = get()
    const prevNotifications = [...notifications]
    const prevUnreadCount = unreadCount

    // 乐观更新
    set({
      notifications: notifications.map(n => ({ ...n, status: 'read' as const })),
      unreadCount: 0,
    })

    try {
      await markAllNotificationsAsRead()
    }
    catch {
      // 回滚
      set({
        notifications: prevNotifications,
        unreadCount: prevUnreadCount,
      })
    }
  },

  deleteNotification: async (id: string) => {
    const { notifications, unreadCount } = get()
    const target = notifications.find(n => n.id === id)
    if (!target)
      return

    const prevNotifications = [...notifications]
    const prevUnreadCount = unreadCount
    const wasUnread = target.status === 'unread'

    // 乐观更新
    set({
      notifications: notifications.filter(n => n.id !== id),
      unreadCount: wasUnread ? Math.max(0, unreadCount - 1) : unreadCount,
      pagination: {
        ...get().pagination,
        total: Math.max(0, get().pagination.total - 1),
      },
    })

    try {
      await deleteNotifications([id])
    }
    catch {
      // 回滚
      set({
        notifications: prevNotifications,
        unreadCount: prevUnreadCount,
        pagination: {
          ...get().pagination,
          total: get().pagination.total + 1,
        },
      })
      get().resetAndFetch()
    }
  },

  reset: () => {
    set({
      notifications: [],
      loading: false,
      loadingMore: false,
      unreadCount: 0,
      pagination: { ...initialPagination },
    })
  },
}))
