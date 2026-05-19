/**
 * MobileBottomBar - 移动端底部导航栏
 * 底部贴边五等分文字导航，激活项使用品牌渐变胶囊强调。
 */
'use client'

import type { MobileBottomBarProps } from '../../types'
import type { IRouterDataItem } from '@/app/layout/routerData'
import Link from 'next/link'
import { useTransClient } from '@/app/i18n/client'
import { visibleRouterData } from '@/app/layout/routerData'
import { cn } from '@/lib/utils'

const bottomNavItems = [
  { routerKey: 'header.draftBox', labelKey: 'header.draftBox', testId: 'content' },
  { routerKey: 'aiSocial', labelKey: 'aiSocial', testId: 'ai-social' },
  { routerKey: 'tasksHistory', labelKey: 'tasksHistory', testId: 'tasks-history' },
  { routerKey: 'accounts', labelKey: 'accounts', testId: 'publish' },
  { routerKey: 'header.agentAssets', labelKey: 'header.agentAssets', testId: 'agent-assets' },
] as const

const publishNavFallback: IRouterDataItem = {
  name: 'AI Publish',
  translationKey: 'aiSocial',
  path: '/accounts',
}

const navLabelBaseClassName
  = 'flex h-9 min-w-0 max-w-full items-center justify-center truncate whitespace-nowrap rounded-full px-2 text-center text-[13px] font-semibold leading-none tracking-[0.01em] transition-all duration-200'

function getNavLabelClassName(isActive: boolean) {
  return cn(
    navLabelBaseClassName,
    isActive
      ? 'h-10 min-w-16 px-5 bg-gradient-back text-gradient-foreground shadow-lg shadow-brand-purple/20'
      : 'text-muted-foreground hover:text-foreground active:text-foreground',
  )
}

function getNavItem(key: string) {
  const itemsToCheck = [...visibleRouterData]

  while (itemsToCheck.length > 0) {
    const item = itemsToCheck.shift()

    if (!item) {
      continue
    }

    if (item.translationKey === key) {
      return item
    }

    if (item.children) {
      itemsToCheck.push(...item.children)
    }
  }

  return undefined
}

function isNavItemActive(item: IRouterDataItem | undefined, currentRoute: string) {
  if (!item?.path) {
    return false
  }

  if (item.path === '/') {
    return currentRoute === '/'
  }

  return currentRoute === item.path || currentRoute.startsWith(`${item.path}/`)
}

function MobileBottomItem({
  item,
  labelKey,
  testId,
  currentRoute,
}: {
  item: IRouterDataItem | undefined
  labelKey: string
  testId: string
  currentRoute: string
}) {
  const { t } = useTransClient('route')

  if (!item?.path) {
    return <div />
  }

  const isActive = isNavItemActive(item, currentRoute)

  return (
    <Link
      href={item.path}
      className={cn(
        'flex h-full min-w-0 cursor-pointer items-center justify-center px-0.5',
        isActive ? 'scale-[1.02]' : 'active:scale-[0.98]',
      )}
      aria-current={isActive ? 'page' : undefined}
      data-testid={`mobile-bottom-nav-${testId}`}
    >
      <span className={getNavLabelClassName(isActive)}>{t(labelKey)}</span>
    </Link>
  )
}

export function MobileBottomBar({ currentRoute, hidden }: MobileBottomBarProps) {
  const navItems = bottomNavItems.map(config => ({
    ...config,
    item: getNavItem(config.routerKey) ?? (config.routerKey === 'accounts' ? publishNavFallback : undefined),
  }))

  if (hidden) {
    return null
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-lg shadow-primary/10 backdrop-blur-xl md:hidden"
        data-testid="mobile-bottom-bar"
      >
        <div className="grid h-14 grid-cols-5 items-center gap-1 px-4 py-2">
          {navItems.map(({ item, labelKey, routerKey, testId }) => (
            <MobileBottomItem
              key={routerKey}
              item={item}
              labelKey={labelKey}
              testId={testId}
              currentRoute={currentRoute}
            />
          ))}
        </div>
      </nav>
    </>
  )
}
