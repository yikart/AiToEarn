/**
 * useIsMobile Hook
 *
 * 功能描述: 检测当前设备是否为移动端（屏幕宽度 < 768px）
 * 用于移动端适配，如禁用拖拽、切换弹窗类型等
 */
import { useEffect, useState } from 'react'

/**
 * 检测当前是否为移动端设备
 * @returns boolean - true 表示移动端，false 表示桌面端
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // SSR 安全检查
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 767px)')

    // 设置初始值
    setIsMobile(mediaQuery.matches)

    // 监听变化
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isMobile
}
