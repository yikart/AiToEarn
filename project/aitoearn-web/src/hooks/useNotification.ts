import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import { useNotificationStore } from '@/store/notification'
import { useUserStore } from '@/store/user'

export function useNotification() {
  const token = useUserStore(state => state.token)
  const { unreadCount, fetchUnreadCount } = useNotificationStore(
    useShallow(state => ({
      unreadCount: state.unreadCount,
      fetchUnreadCount: state.fetchUnreadCount,
    })),
  )

  useEffect(() => {
    if (!token)
      return

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [token, fetchUnreadCount])

  return {
    unreadCount,
    refreshUnreadCount: fetchUnreadCount,
  }
}
