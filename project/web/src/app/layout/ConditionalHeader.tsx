'use client'

import { usePathname } from 'next/navigation'
import HomeHeader from '@/app/layout/HomeHeader'
import { removeLocalePrefix } from '@/app/layout/layout.utils'
import LyaoutHeader from '@/app/layout/LyaoutHeader'
import { homeHeaderRouterData } from '@/app/layout/routerData'

export default function ConditionalHeader() {
  const pathname = usePathname()
  const currentPath = removeLocalePrefix(pathname).replace(/\/+$/, '') || '/'

  const isActive = (href: string) => {
    if (!href.startsWith('/'))
      return false
    const normalizedHref = href.replace(/\/+$/, '') || '/'
    if (normalizedHref === '/')
      return currentPath === '/'
    if (currentPath === normalizedHref)
      return true
    return currentPath.startsWith(`${normalizedHref}/`)
  }

  if (homeHeaderRouterData.value.some(v => isActive(v.href))) {
    return <HomeHeader />
  }

  return <LyaoutHeader />
}
