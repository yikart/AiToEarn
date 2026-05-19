/**
 * useNavigationLogic - 导航逻辑共享 Hook
 * 提供路由计算和页面类型判断，供 MobileNav 和 LayoutSidebar 共用
 */
'use client'

import { useSelectedLayoutSegments } from 'next/navigation'

/** 需要隐藏导航的路由 */
const HIDDEN_NAV_ROUTES = ['auth', 'websit']

/** 需要隐藏移动端底部导航的路由 */
const HIDDEN_BOTTOM_NAV_ROUTES: string[] = []

/**
 * 导航逻辑 Hook
 * 返回当前路由、导航隐藏状态与原始路由段。
 */
export function useNavigationLogic() {
  const route = useSelectedLayoutSegments()

  // 计算当前路由
  let currRouter = '/'
  if (route.length === 1) {
    currRouter = route[0]
    currRouter = currRouter === '/' ? currRouter : `/${currRouter}`
  }
  else if (route.length >= 2) {
    currRouter = `/${route.slice(0, 2).join('/')}`
  }

  // 判断是否为需要隐藏导航的页面
  const rootRoute = route[0]
  const isAuthPage = HIDDEN_NAV_ROUTES.includes(rootRoute)
  const isBottomNavHidden = isAuthPage || HIDDEN_BOTTOM_NAV_ROUTES.includes(rootRoute)

  return { currRouter, isAuthPage, isBottomNavHidden, route }
}
