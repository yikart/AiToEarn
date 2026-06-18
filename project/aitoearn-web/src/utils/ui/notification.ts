/**
 * notification - 全局通知工具
 * 支持 success/error/warning/info 四种类型
 */

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface NotificationOptions {
  key?: string
  id?: string
  duration?: number
  content?: React.ReactNode
}

interface NotificationPayload {
  key?: string
  id?: string
  content?: React.ReactNode
  duration?: number
  type?: NotificationType
  _uid?: string
}

function emit(payload: NotificationPayload) {
  if (typeof window === 'undefined') {
    // server-side fallback: no-op
    return
  }
  try {
    window.dispatchEvent(new CustomEvent('aito:notification', { detail: payload }))
  }
  catch {
    // ignore
  }
}

function removeEmit(payload: { key?: string, id?: string, _uid?: string }) {
  if (typeof window === 'undefined')
    return
  try {
    window.dispatchEvent(new CustomEvent('aito:notification-remove', { detail: payload }))
  }
  catch {
    // ignore
  }
}

function createNotification(type: NotificationType) {
  return (content: React.ReactNode | NotificationOptions, options?: NotificationOptions) => {
    const payload
      = typeof content === 'object' && content !== null && 'content' in content
        ? {
            key: (content as NotificationOptions).key,
            id: (content as NotificationOptions).id,
            content: (content as NotificationOptions).content,
            duration: (content as NotificationOptions).duration,
          }
        : {
            key: options?.key,
            id: options?.id,
            content: content as React.ReactNode,
            duration: options?.duration,
          }
    const uid = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
    emit({ ...payload, type, _uid: uid })
    return uid
  }
}

export const notification = {
  success: createNotification('success'),
  error: createNotification('error'),
  warning: createNotification('warning'),
  info: createNotification('info'),
  loading: createNotification('loading'),

  open(options: {
    key?: string
    type?: NotificationType
    content: React.ReactNode
    duration?: number
  }) {
    const uid = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
    const payload: NotificationPayload = {
      key: options.key,
      id: options.key,
      content: options.content,
      duration: options.duration,
      type: options.type || 'info',
      _uid: uid,
    }
    emit(payload)
    return uid
  },

  destroy(key?: string) {
    if (!key)
      return
    // try remove by uid first
    removeEmit({ _uid: key, key })
  },
}

export default notification
