/**
 * NavSection - 侧边栏主导航区域
 */

'use client'

import type { NavItemData, NavSectionProps, SidebarCommonProps } from '../types'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { useTransClient } from '@/app/i18n/client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useGetClientLng } from '@/hooks/useSystem'
import { cn } from '@/utils/className'

/** 单个导航项 */
interface NavItemProps extends SidebarCommonProps {
  item: NavItemData
  currentRoute: string
  level?: number
}

interface NavItemActiveState {
  isSelfActive: boolean
  isDescendantActive: boolean
  isActive: boolean
}

function isItemActive(item: NavItemData, currentRoute: string): boolean {
  if (item.path === currentRoute) {
    return true
  }

  return item.children?.some(child => isItemActive(child, currentRoute)) ?? false
}

function getItemActiveState(item: NavItemData, currentRoute: string): NavItemActiveState {
  const isSelfActive = item.path === currentRoute
  const isDescendantActive = item.children?.some(child => isItemActive(child, currentRoute)) ?? false

  return {
    isSelfActive,
    isDescendantActive,
    isActive: isSelfActive || isDescendantActive,
  }
}

function NavItem({ item, currentRoute, collapsed, level = 0 }: NavItemProps) {
  const { t } = useTransClient('route')
  const lng = useGetClientLng()
  const { isActive, isDescendantActive, isSelfActive } = getItemActiveState(item, currentRoute)
  const hasChildren = Boolean(item.children?.length)
  const fullPath = item.path
    ? item.path.startsWith('/')
      ? `/${lng}${item.path}`
      : `/${lng}/${item.path}`
    : undefined
  const showStrongActive = isSelfActive || (collapsed && isActive)
  const showBranchActive = !showStrongActive && !collapsed && level === 0 && hasChildren && isDescendantActive

  const contentNode = (
    <div
      className={cn(
        'relative flex w-full min-w-0 items-center text-sm font-medium transition-[background-color,color,box-shadow] duration-200',
        level === 0 ? 'rounded-xl' : 'rounded-lg',
        showStrongActive
          ? 'bg-brand-cyan/10 text-brand-cyan ring-1 ring-inset ring-brand-cyan/25'
          : 'text-muted-foreground hover:bg-brand-cyan/10 hover:text-brand-cyan',
        showBranchActive && 'text-brand-cyan',
        collapsed
          ? 'justify-center px-2 py-2.5'
          : level === 0
            ? 'gap-3 px-3 py-2.5'
            : 'gap-2.5 px-3 py-2 text-[13px]',
      )}
    >
      {showBranchActive && (
        <span className="absolute left-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand-cyan" />
      )}
      <span
        className={cn(
          'flex shrink-0 items-center justify-center',
          showStrongActive && 'text-brand-cyan',
          showBranchActive && 'text-brand-cyan',
          !showStrongActive && !showBranchActive && level > 0 && 'opacity-80',
        )}
      >
        {level === 0 ? (
          item.icon || <FileText size={20} />
        ) : (
          <span className="size-1.5 rounded-full bg-current/60" />
        )}
      </span>
      {!collapsed && (
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {t(item.translationKey)}
        </span>
      )}
    </div>
  )

  const content = fullPath ? (
    <Link href={fullPath} className="block w-full" data-testid={`sidebar-nav-item-${item.translationKey}`}>
      {contentNode}
    </Link>
  ) : (
    <div className="w-full" data-testid={`sidebar-nav-item-${item.translationKey}`}>{contentNode}</div>
  )

  const renderedContent = collapsed ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{t(item.translationKey)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    content
  )

  if (!hasChildren || collapsed) {
    return renderedContent
  }

  return (
    <div className="space-y-1">
      {renderedContent}
      <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border/50 pl-3">
        {item.children?.map(child => (
          <NavItem
            key={child.path || child.translationKey}
            item={child}
            currentRoute={currentRoute}
            collapsed={collapsed}
            level={level + 1}
          />
        ))}
      </div>
    </div>
  )
}

export function NavSection({ items, currentRoute, collapsed }: NavSectionProps) {
  // 旧 "More" 分组内的项改为直接展示在主菜单底部
  const trailingKeys = ['tasksHistory', 'header.materialLibrary']
  const mainItems = items.filter(item => !trailingKeys.includes(item.translationKey))
  const trailingItems = trailingKeys
    .map(key => items.find(i => i.translationKey === key))
    .filter((i): i is NavItemData => i !== undefined)
  const navItems = [...mainItems, ...trailingItems]

  return (
    <nav className="flex flex-col gap-1 pr-1" data-testid="sidebar-nav">
      {navItems.map(item => (
        <NavItem
          key={item.path || item.translationKey}
          item={item}
          currentRoute={currentRoute}
          collapsed={collapsed}
        />
      ))}
    </nav>
  )
}
