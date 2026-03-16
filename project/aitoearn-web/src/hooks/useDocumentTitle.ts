/**
 * useDocumentTitle - 动态更新浏览器页面标题
 * 功能：在客户端组件中动态设置 document.title
 */
import { useEffect } from 'react'
import { useGetClientLng } from '@/hooks/useSystem'
import { getPageTitle } from '@/utils/general'

/**
 * 动态更新浏览器页面标题
 * @param title - 页面标题（为空时使用 defaultTitle）
 * @param defaultTitle - 默认标题（title 为空时使用）
 *
 * @example
 * ```tsx
 * // 基本用法
 * useDocumentTitle(task?.title, '新对话')
 *
 * // 仅在有标题时更新
 * useDocumentTitle(taskDetail?.title)
 * ```
 */
export function useDocumentTitle(title: string | undefined | null, defaultTitle?: string) {
  const lng = useGetClientLng()

  useEffect(() => {
    ;(async () => {
      const displayTitle = title || defaultTitle
      if (displayTitle) {
        document.title = await getPageTitle(displayTitle, lng)
      }
    })()
  }, [title, defaultTitle, lng])
}
