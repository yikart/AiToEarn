/**
 * MainContent - 主内容区域包装组件
 * 根据当前路由动态控制顶部和底部间距（用于移动端顶部栏与底部导航栏占位）
 */
'use client'

import { useNavigationLogic } from '@/app/layout/shared/hooks/useNavigationLogic'
import { cn } from '@/utils/className'

interface MainContentProps {
  children: React.ReactNode
  banner?: React.ReactNode
}

export function MainContent({ children, banner }: MainContentProps) {
  const { isAuthPage, isBottomNavHidden } = useNavigationLogic()

  return (
    <main
      className={cn(
        'flex-1 min-h-0 min-w-0 flex flex-col',
        // 非 auth 页面需要为移动端顶部栏和 BottomBar 留空间
        !isAuthPage && 'pt-14 md:pt-0',
        !isBottomNavHidden && 'pb-20 md:pb-0',
      )}
    >
      {banner}
      <div
        id="main-content"
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
      >
        {children}
      </div>
    </main>
  )
}
