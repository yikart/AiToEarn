interface NotificationOptions {
  key?: string
  id?: string
  duration?: number
  content?: React.ReactNode
}

function emit(payload: { key?: string, id?: string, content?: React.ReactNode, duration?: number, _uid?: string }) {
  if (typeof window === 'undefined') {
    // server-side fallback: no-op
    return
  }
  try {
    window.dispatchEvent(new CustomEvent('aito:notification', { detail: payload }))
  }
  catch (e) {
    // ignore
  }
}

function removeEmit(payload: { key?: string, id?: string, _uid?: string }) {
  if (typeof window === 'undefined')
    return
  try {
    window.dispatchEvent(new CustomEvent('aito:notification-remove', { detail: payload }))
  }
  catch (e) {}
}

export const notification = {
  success(content: React.ReactNode | NotificationOptions, options?: NotificationOptions) {
    const payload = typeof content === 'object' && content !== null && 'content' in content
      ? { key: (content as NotificationOptions).key, id: (content as NotificationOptions).id, content: (content as NotificationOptions).content, duration: (content as NotificationOptions).duration }
      : { key: options?.key, id: options?.id, content: content as React.ReactNode, duration: options?.duration }
    const uid = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
    emit({ ...payload, _uid: uid })
    return uid
  },

  error(content: React.ReactNode | NotificationOptions, options?: NotificationOptions) {
    const payload = typeof content === 'object' && content !== null && 'content' in content
      ? { key: (content as NotificationOptions).key, id: (content as NotificationOptions).id, content: (content as NotificationOptions).content, duration: (content as NotificationOptions).duration }
      : { key: options?.key, id: options?.id, content: content as React.ReactNode, duration: options?.duration }
    const uid = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
    emit({ ...payload, _uid: uid })
    return uid
  },

  warning(content: React.ReactNode | NotificationOptions, options?: NotificationOptions) {
    const payload = typeof content === 'object' && content !== null && 'content' in content
      ? { key: (content as NotificationOptions).key, id: (content as NotificationOptions).id, content: (content as NotificationOptions).content, duration: (content as NotificationOptions).duration }
      : { key: options?.key, id: options?.id, content: content as React.ReactNode, duration: options?.duration }
    const uid = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
    emit({ ...payload, _uid: uid })
    return uid
  },

  info(content: React.ReactNode | NotificationOptions, options?: NotificationOptions) {
    const payload = typeof content === 'object' && content !== null && 'content' in content
      ? { key: (content as NotificationOptions).key, id: (content as NotificationOptions).id, content: (content as NotificationOptions).content, duration: (content as NotificationOptions).duration }
      : { key: options?.key, id: options?.id, content: content as React.ReactNode, duration: options?.duration }
    const uid = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
    emit({ ...payload, _uid: uid })
    return uid
  },

  open(options: { key?: string, type?: 'success' | 'error' | 'warning' | 'info' | 'loading', content: React.ReactNode, duration?: number }) {
    const uid = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
    const payload = { key: options.key, id: options.key, content: options.content, duration: options.duration, _uid: uid }
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
