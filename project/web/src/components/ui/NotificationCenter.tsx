'use client'

import React, { useEffect, useRef, useState } from 'react'

interface NotificationDetail {
  key?: string
  id?: string
  _uid?: string
  content?: React.ReactNode
  duration?: number
}

interface NotificationItem {
  uid: string // internal unique id
  key?: string
  content: React.ReactNode
  duration: number
  expiresAt: number
  visible: boolean
}

function genUid() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

export const NotificationCenter: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([])
  const timeoutsRef = useRef<Record<string, number>>({})
  const remainingRef = useRef<Record<string, number>>({})
  const pinnedRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    function onAdd(e: Event) {
      const detail = (e as CustomEvent)?.detail as NotificationDetail | undefined
      if (!detail)
        return
      const uid = detail._uid || genUid()
      const key = detail.key || detail.id
      const duration = (typeof detail.duration === 'number') ? detail.duration * 1000 : 3000
      const expiresAt = Date.now() + duration
      const item: NotificationItem = { uid, key, content: detail.content || '', duration, expiresAt, visible: false }
      // add to top
      setItems(prev => [item, ...prev])
      // trigger enter animation
      setTimeout(() => {
        setItems(prev => prev.map(it => it.uid === uid ? { ...it, visible: true } : it))
      }, 10)

      // auto remove after duration (unless pinned)
      const timeoutId = window.setTimeout(() => {
        if (pinnedRef.current[uid]) {
          // do not auto-remove if pinned
          delete timeoutsRef.current[uid]
          return
        }
        // start exit animation
        setItems(prev => prev.map(it => it.uid === uid ? { ...it, visible: false } : it))
        // remove after animation
        const removeId = window.setTimeout(() => {
          setItems(prev => prev.filter(it => it.uid !== uid))
          delete timeoutsRef.current[uid]
          delete remainingRef.current[uid]
        }, 200)
        timeoutsRef.current[uid] = removeId
      }, duration)
      timeoutsRef.current[uid] = timeoutId
      remainingRef.current[uid] = duration
    }

    function onRemove(e: Event) {
      const detail = (e as CustomEvent)?.detail as NotificationDetail | undefined
      if (!detail)
        return
      const uid = detail._uid
      const key = detail.key || detail.id
      if (uid) {
        // clear pending timeout if any
        if (timeoutsRef.current[uid]) {
          clearTimeout(timeoutsRef.current[uid])
          delete timeoutsRef.current[uid]
        }
        setItems(prev => prev.map(it => it.uid === uid ? { ...it, visible: false } : it))
        setTimeout(() => setItems(prev => prev.filter(it => it.uid !== uid)), 200)
        return
      }
      if (key) {
        // remove only first matched key (avoid closing all with same key)
        let removed = false
        let removedUid: string | null = null
        setItems(prev => prev.map((it) => {
          if (!removed && it.key === key) {
            removed = true
            removedUid = it.uid
            return { ...it, visible: false }
          }
          return it
        }))
        setTimeout(() => {
          if (removedUid) {
            if (timeoutsRef.current[removedUid]) {
              clearTimeout(timeoutsRef.current[removedUid])
              delete timeoutsRef.current[removedUid]
            }
          }
          setItems(prev => prev.filter(it => it.uid !== removedUid))
        }, 200)
      }
    }

    window.addEventListener('aito:notification', onAdd as EventListener)
    window.addEventListener('aito:notification-remove', onRemove as EventListener)
    return () => {
      window.removeEventListener('aito:notification', onAdd as EventListener)
      window.removeEventListener('aito:notification-remove', onRemove as EventListener)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-3">
      {items.map(item => (
        <div
          key={item.uid}
          className={[
            'w-80 bg-white/95 text-zinc-900 dark:bg-zinc-900/95 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-lg p-3',
            'transform transition-all duration-200 ease-out',
            item.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
            'rounded-sm',
          ].join(' ')}
          role="status"
        >
          <div
            className="flex items-start justify-between gap-3"
            onMouseEnter={() => {
              const uid = item.uid
              // mark pinned so it will not auto-remove
              pinnedRef.current[uid] = true
              if (timeoutsRef.current[uid]) {
                clearTimeout(timeoutsRef.current[uid])
                delete timeoutsRef.current[uid]
              }
            }}
            onMouseLeave={() => {
              // Do nothing: once hovered, notification stays until manually closed
            }}
          >
            <div className="flex-1 text-sm wrap-break-word">
              {item.content}
            </div>
            <button
              aria-label="Close notification"
              onClick={() => {
                // clear any existing timeout for this uid
                if (timeoutsRef.current[item.uid]) {
                  clearTimeout(timeoutsRef.current[item.uid])
                  delete timeoutsRef.current[item.uid]
                }
                setItems(prev => prev.map(it => it.uid === item.uid ? { ...it, visible: false } : it))
                setTimeout(() => {
                  setItems(prev => prev.filter(it => it.uid !== item.uid))
                  delete remainingRef.current[item.uid]
                }, 200)
              }}
              className="ml-3 text-sm opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default NotificationCenter
