/**
 * NavSection - 侧边栏主导航区域
 */

'use client'

import type { NavItemData, NavSectionProps, SidebarCommonProps } from '../types'
import { FileText, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useGetClientLng } from '@/hooks/useSystem'
import { cn } from '@/lib/utils'

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
  // Keys to group into the "More" section
  // Order: tasksHistory, materialLibrary
  const groupKeys = ['tasksHistory', 'header.materialLibrary']

  // Main items: only Home and Publish (accounts)
  const mainItems = items.filter(i => !groupKeys.includes(i.translationKey as string))
  // Grouped items in specified order
  const groupedItems = groupKeys
    .map(key => items.find(i => i.translationKey === key))
    .filter((i): i is NavItemData => i !== undefined)

  const [groupOpen, setGroupOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout>()
  const { t } = useTransClient(['route', 'common'])

  // Auto-expand group if current route is in the grouped items (only for expanded mode)
  useEffect(() => {
    if (!collapsed) {
      const isCurrentRouteInGroup = groupedItems.some(item => isItemActive(item, currentRoute))
      if (isCurrentRouteInGroup && !groupOpen) {
        setGroupOpen(true)
      }
    }
  }, [currentRoute, groupedItems, groupOpen, collapsed])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setPopoverOpen(true)
    }, 200)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setPopoverOpen(false)
    }, 300)
  }

  return (
    <nav className="flex flex-col gap-1 pr-1" data-testid="sidebar-nav">
      {/* Main navigation items: Home, Publish */}
      {mainItems.map(item => (
        <NavItem
          key={item.path || item.translationKey}
          item={item}
          currentRoute={currentRoute}
          collapsed={collapsed}
        />
      ))}

      {/* Collapsible "More" section */}
      {groupedItems.length > 0 && (
        <div>
          {collapsed ? (
            /* Collapsed mode: Show popover menu on hover */
            <div className="mt-1">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'relative flex items-center justify-center rounded-lg text-sm font-medium transition-all w-full',
                      'text-muted-foreground hover:bg-brand-cyan/10 hover:text-brand-cyan',
                      'px-2 py-2.5',
                    )}
                    data-testid="sidebar-more-btn"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span className="flex shrink-0 items-center justify-center">
                      <MoreHorizontal size={20} />
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  className="w-48 p-2"
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current)
                    }
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="space-y-1">
                    {groupedItems.map(gitem => (
                      <NavItem
                        key={gitem.path || gitem.translationKey}
                        item={gitem}
                        currentRoute={currentRoute}
                        collapsed={false}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            /* Expanded mode: Show traditional collapsible group */
            <>
              <div className="mt-1">
                <button
                  onClick={() => setGroupOpen(s => !s)}
                  data-testid="sidebar-more-btn"
                  className={cn(
                    'relative flex items-center rounded-lg text-sm font-medium transition-all w-full',
                    'text-muted-foreground hover:bg-brand-cyan/10 hover:text-brand-cyan',
                    groupOpen && 'bg-brand-cyan/10 text-brand-cyan',
                    'gap-3 px-3 py-2.5',
                  )}
                >
                  <span className="flex shrink-0 items-center justify-center">
                    <MoreHorizontal size={20} />
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {t('sidebar.more')}
                  </span>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-60">
                    {groupOpen ? '−' : '+'}
                  </span>
                </button>
              </div>

              {/* Expand list when open */}
              {groupOpen && (
                <div className="mt-1 pl-2" data-testid="sidebar-more-group">
                  <div className="flex flex-col gap-1">
                    {groupedItems.map(gitem => (
                      <NavItem
                        key={gitem.path || gitem.translationKey}
                        item={gitem}
                        currentRoute={currentRoute}
                        collapsed={collapsed}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  )
}
