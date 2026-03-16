/**
 * NotificationCenter - 全局通知中心组件
 * 显示不同类型的通知（success/error/warning/info/loading）
 * 支持鼠标悬停暂停自动关闭、手动关闭等功能
 */
'use client'

import { AlertCircle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface NotificationDetail {
  key?: string
  id?: string
  _uid?: string
  content?: React.ReactNode
  duration?: number
  type?: NotificationType
}

interface NotificationItem {
  uid: string
  key?: string
  content: React.ReactNode
  duration: number
  expiresAt: number
  visible: boolean
  type: NotificationType
  isPaused: boolean
}

function genUid() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

// 通知图标配置
const notificationConfig: Record<
  NotificationType,
  {
    icon: React.ReactNode
    containerClass: string
    iconClass: string
  }
> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    containerClass: 'border-green-200 dark:border-green-800/50 bg-green-50/95 dark:bg-green-950/95',
    iconClass: 'text-green-600 dark:text-green-400',
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    containerClass: 'border-red-200 dark:border-red-800/50 bg-red-50/95 dark:bg-red-950/95',
    iconClass: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: <AlertCircle className="w-5 h-5" />,
    containerClass:
      'border-yellow-200 dark:border-yellow-800/50 bg-yellow-50/95 dark:bg-yellow-950/95',
    iconClass: 'text-yellow-600 dark:text-yellow-500',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    containerClass: 'border-blue-200 dark:border-blue-800/50 bg-blue-50/95 dark:bg-blue-950/95',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  loading: {
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    containerClass: 'border-border bg-card/95',
    iconClass: 'text-primary',
  },
}

export const NotificationCenter: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([])
  const timeoutsRef = useRef<Record<string, number>>({})
  const remainingRef = useRef<Record<string, number>>({})
  const animationStartRef = useRef<Record<string, number>>({})

  useEffect(() => {
    function onAdd(e: Event) {
      const detail = (e as CustomEvent)?.detail as NotificationDetail | undefined
      if (!detail)
        return
      const uid = detail._uid || genUid()
      const key = detail.key || detail.id
      const type = detail.type || 'info'
      // loading 类型默认不自动关闭，其他类型默认 3 秒
      const defaultDuration = type === 'loading' ? 0 : 3000
      const duration
        = typeof detail.duration === 'number' ? detail.duration * 1000 : defaultDuration
      const expiresAt = duration > 0 ? Date.now() + duration : 0
      const item: NotificationItem = {
        uid,
        key,
        content: detail.content || '',
        duration,
        expiresAt,
        visible: false,
        type,
        isPaused: false,
      }

      // 相同 key 去重：如果已有同 key 的通知，替换内容并重置计时器，不再新增
      if (key) {
        setItems((prev) => {
          const existingIndex = prev.findIndex(it => it.key === key)
          if (existingIndex !== -1) {
            const existing = prev[existingIndex]
            // 清除旧的定时器
            if (timeoutsRef.current[existing.uid]) {
              clearTimeout(timeoutsRef.current[existing.uid])
              delete timeoutsRef.current[existing.uid]
            }
            delete remainingRef.current[existing.uid]
            delete animationStartRef.current[existing.uid]

            // 用新 uid 替换旧通知，保持位置不变
            const updated = [...prev]
            updated[existingIndex] = { ...item, visible: true }
            // 为新 uid 设置自动关闭
            if (duration > 0) {
              animationStartRef.current[uid] = Date.now()
              remainingRef.current[uid] = duration
              const timeoutId = window.setTimeout(() => {
                setItems(p => p.map(it => (it.uid === uid ? { ...it, visible: false } : it)))
                const removeId = window.setTimeout(() => {
                  setItems(p => p.filter(it => it.uid !== uid))
                  delete timeoutsRef.current[uid]
                  delete remainingRef.current[uid]
                  delete animationStartRef.current[uid]
                }, 300)
                timeoutsRef.current[uid] = removeId
              }, duration)
              timeoutsRef.current[uid] = timeoutId
            }
            return updated
          }
          return [item, ...prev]
        })
      }
      else {
        // 无 key 的通知正常添加到顶部
        setItems(prev => [item, ...prev])
      }

      // 触发入场动画（仅对新增的通知）
      setTimeout(() => {
        setItems(prev => prev.map(it => (it.uid === uid ? { ...it, visible: true } : it)))
      }, 10)

      // 自动关闭（duration > 0，仅对无 key 或新增的通知）
      if (duration > 0 && !key) {
        // 记录动画开始时间
        animationStartRef.current[uid] = Date.now()
        remainingRef.current[uid] = duration

        const timeoutId = window.setTimeout(() => {
          // 开始退出动画
          setItems(prev => prev.map(it => (it.uid === uid ? { ...it, visible: false } : it)))
          // 动画结束后移除
          const removeId = window.setTimeout(() => {
            setItems(prev => prev.filter(it => it.uid !== uid))
            delete timeoutsRef.current[uid]
            delete remainingRef.current[uid]
            delete animationStartRef.current[uid]
          }, 300)
          timeoutsRef.current[uid] = removeId
        }, duration)
        timeoutsRef.current[uid] = timeoutId
      }
    }

    function onRemove(e: Event) {
      const detail = (e as CustomEvent)?.detail as NotificationDetail | undefined
      if (!detail)
        return
      const uid = detail._uid
      const key = detail.key || detail.id
      if (uid) {
        if (timeoutsRef.current[uid]) {
          clearTimeout(timeoutsRef.current[uid])
          delete timeoutsRef.current[uid]
        }
        setItems(prev => prev.map(it => (it.uid === uid ? { ...it, visible: false } : it)))
        setTimeout(() => setItems(prev => prev.filter(it => it.uid !== uid)), 300)
        return
      }
      if (key) {
        let removed = false
        let removedUid: string | null = null
        setItems(prev =>
          prev.map((it) => {
            if (!removed && it.key === key) {
              removed = true
              removedUid = it.uid
              return { ...it, visible: false }
            }
            return it
          }),
        )
        setTimeout(() => {
          if (removedUid) {
            if (timeoutsRef.current[removedUid]) {
              clearTimeout(timeoutsRef.current[removedUid])
              delete timeoutsRef.current[removedUid]
            }
          }
          setItems(prev => prev.filter(it => it.uid !== removedUid))
        }, 300)
      }
    }

    window.addEventListener('aito:notification', onAdd as EventListener)
    window.addEventListener('aito:notification-remove', onRemove as EventListener)
    return () => {
      window.removeEventListener('aito:notification', onAdd as EventListener)
      window.removeEventListener('aito:notification-remove', onRemove as EventListener)
    }
  }, [])

  // 关闭通知
  const handleClose = (uid: string) => {
    if (timeoutsRef.current[uid]) {
      clearTimeout(timeoutsRef.current[uid])
      delete timeoutsRef.current[uid]
    }
    setItems(prev => prev.map(it => (it.uid === uid ? { ...it, visible: false } : it)))
    setTimeout(() => {
      setItems(prev => prev.filter(it => it.uid !== uid))
      delete remainingRef.current[uid]
      delete animationStartRef.current[uid]
    }, 300)
  }

  // 鼠标进入暂停自动关闭
  const handleMouseEnter = (uid: string, item: NotificationItem) => {
    // 清除当前定时器
    if (timeoutsRef.current[uid]) {
      clearTimeout(timeoutsRef.current[uid])
      delete timeoutsRef.current[uid]
    }
    // 计算剩余时间
    const startTime = animationStartRef.current[uid]
    if (startTime && item.duration > 0) {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, item.duration - elapsed)
      remainingRef.current[uid] = remaining
    }
    // 标记为暂停，触发 CSS 动画暂停
    setItems(prev => prev.map(it => (it.uid === uid ? { ...it, isPaused: true } : it)))
  }

  // 鼠标离开恢复自动关闭
  const handleMouseLeave = (uid: string, item: NotificationItem) => {
    const remaining = remainingRef.current[uid]
    // 如果没有剩余时间或 duration 为 0，不需要恢复
    if (!remaining || remaining <= 0 || item.duration <= 0) {
      setItems(prev => prev.map(it => (it.uid === uid ? { ...it, isPaused: false } : it)))
      return
    }

    // 更新动画开始时间，使进度条从暂停位置继续
    animationStartRef.current[uid] = Date.now() - (item.duration - remaining)

    // 恢复动画
    setItems(prev => prev.map(it => (it.uid === uid ? { ...it, isPaused: false } : it)))

    // 重新设置定时器
    const timeoutId = window.setTimeout(() => {
      // 开始退出动画
      setItems(prev => prev.map(it => (it.uid === uid ? { ...it, visible: false } : it)))
      // 动画结束后移除
      const removeId = window.setTimeout(() => {
        setItems(prev => prev.filter(it => it.uid !== uid))
        delete timeoutsRef.current[uid]
        delete remainingRef.current[uid]
        delete animationStartRef.current[uid]
      }, 300)
      timeoutsRef.current[uid] = removeId
    }, remaining)
    timeoutsRef.current[uid] = timeoutId
  }

  return (
    <div className="fixed top-4 right-4 z-[500000] flex flex-col items-end gap-3 pointer-events-none">
      {items.map((item) => {
        const config = notificationConfig[item.type]

        return (
          <div
            key={item.uid}
            className={cn(
              'w-[360px] max-w-[calc(100vw-2rem)] pointer-events-auto',
              'border rounded-lg shadow-lg backdrop-blur-sm',
              'transform transition-all duration-300 ease-out',
              item.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4',
              config.containerClass,
            )}
            role="status"
            aria-live="polite"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onPointerDownCapture={(e) => {
              // 在捕获阶段阻止事件传播
              // Radix UI 的 DismissableLayer 使用 onPointerDownCapture 检测外部点击
              // 必须在捕获阶段阻止，否则冒泡阶段已经太晚
              e.stopPropagation()
            }}
            onMouseEnter={() => handleMouseEnter(item.uid, item)}
            onMouseLeave={() => handleMouseLeave(item.uid, item)}
          >
            <div className="flex items-start gap-3 p-4">
              {/* 图标 */}
              <div className={cn('flex-shrink-0 mt-0.5', config.iconClass)}>{config.icon}</div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground break-words">
                  {item.content}
                </div>
              </div>

              {/* 关闭按钮 */}
              <button
                type="button"
                aria-label="Close notification"
                onClick={() => handleClose(item.uid)}
                className={cn(
                  'flex-shrink-0 p-1 rounded-md cursor-pointer',
                  'text-muted-foreground/60 hover:text-foreground',
                  'hover:bg-black/5 dark:hover:bg-white/10',
                  'transition-colors duration-150',
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 进度条（可选，显示剩余时间） */}
            {item.duration > 0 && item.visible && (
              <div className="h-1 bg-black/5 dark:bg-white/5 rounded-b-lg overflow-hidden">
                <div
                  className={cn(
                    'h-full',
                    item.type === 'success' && 'bg-green-500',
                    item.type === 'error' && 'bg-red-500',
                    item.type === 'warning' && 'bg-yellow-500',
                    item.type === 'info' && 'bg-blue-500',
                    item.type === 'loading' && 'bg-primary',
                  )}
                  style={{
                    width: '100%',
                    animation: `shrink ${item.duration}ms linear forwards`,
                    animationPlayState: item.isPaused ? 'paused' : 'running',
                  }}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* 进度条动画 CSS */}
      <style jsx>
        {`
          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}
      </style>
    </div>
  )
}

export default NotificationCenter
