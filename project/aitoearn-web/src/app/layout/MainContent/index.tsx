/**
 * MainContent - 主内容区域包装组件
 * 根据当前路由动态控制顶部间距（pt-14 用于移动端导航栏占位）
 */
'use client'

import { useNavigationLogic } from '@/app/layout/shared/hooks/useNavigationLogic'
import { cn } from '@/lib/utils'

interface MainContentProps {
  children: React.ReactNode
  banner?: React.ReactNode
}

export function MainContent({ children, banner }: MainContentProps) {
  const { isAuthPage } = useNavigationLogic()

  return (
    <main
      className={cn(
        'flex-1 min-h-0 min-w-0 flex flex-col',
        // 非 auth 页面需要顶部间距给移动端导航栏留空间
        !isAuthPage && 'pt-14 md:pt-0',
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
