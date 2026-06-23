/**
 * useNavigationLogic - shared navigation hook
 * Provides route calculation and navigation visibility for MobileNav and LayoutSidebar.
 */
'use client'

import { useSelectedLayoutSegments } from 'next/navigation'

const HIDDEN_NAV_ROUTES = ['auth', 'websit', '(welcome)']

export function useNavigationLogic() {
  const route = useSelectedLayoutSegments()

  let currRouter = '/'
  if (route.length === 1) {
    currRouter = route[0]
    currRouter = currRouter === '/' ? currRouter : `/${currRouter}`
  }
  else if (route.length >= 2) {
    currRouter = `/${route.slice(0, 2).join('/')}`
  }

  const rootRoute = route[0]
  const isAuthPage = HIDDEN_NAV_ROUTES.includes(rootRoute)
  const isBottomNavHidden = isAuthPage

  return { currRouter, isAuthPage, isBottomNavHidden, route }
}
