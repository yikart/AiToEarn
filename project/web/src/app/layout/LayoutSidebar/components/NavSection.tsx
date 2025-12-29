/**
 * NavSection - 侧边栏主导航区域
 */

'use client'

import type { NavItemData, NavSectionProps, SidebarCommonProps } from '../types'
import { FileText, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useGetClientLng } from '@/hooks/useSystem'
import { cn } from '@/lib/utils'

/** 单个导航项 */
interface NavItemProps extends SidebarCommonProps {
  item: NavItemData
  isActive: boolean
}

function NavItem({ item, isActive, collapsed }: NavItemProps) {
  const { t } = useTransClient('route')
  const lng = useGetClientLng()
  const fullPath = item.path.startsWith('/') ? `/${lng}${item.path}` : `/${lng}/${item.path}`

  const content = (
    <Link
      href={fullPath}
      className={cn(
        'relative flex items-center rounded-lg text-sm font-medium transition-all',
        'text-muted-foreground hover:bg-accent hover:text-foreground',
        isActive && 'bg-background text-foreground shadow-sm',
        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
      )}
    >
      {/* 激活状态左边框指示器 */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-foreground" />
      )}
      <span className={cn('flex shrink-0 items-center justify-center', isActive && 'text-foreground')}>
        {item.icon || <FileText size={20} />}
      </span>
      {!collapsed && (
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {t(item.translationKey)}
        </span>
      )}
    </Link>
  )

  // 收缩状态下显示 Tooltip
  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{t(item.translationKey)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

export function NavSection({ items, currentRoute, collapsed }: NavSectionProps) {
  // Keys to group into the "More" section
  // Order: tasksHistory, interactive (作品互动), dataStatistics, materialLibrary, draftBox
  const groupKeys = [
    'tasksHistory',
    'interactive',
    'dataStatistics',
    'header.materialLibrary',
    'header.draftBox',
  ]

  // Main items: only Home and Publish (accounts)
  const mainItems = items.filter(i => !groupKeys.includes(i.translationKey as string))
  // Grouped items in specified order
  const groupedItems = groupKeys
    .map(key => items.find(i => i.translationKey === key))
    .filter((i): i is NavItemData => i !== undefined)

  const [groupOpen, setGroupOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout>()
  const { t } = useTransClient('route')

  // Auto-expand group if current route is in the grouped items (only for expanded mode)
  useEffect(() => {
    if (!collapsed) {
      const isCurrentRouteInGroup = groupedItems.some(item => item.path === currentRoute)
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
    <nav className="flex flex-col gap-1">
      {/* Main navigation items: Home, Publish */}
      {mainItems.map(item => (
        <NavItem
          key={item.path || item.translationKey}
          item={item}
          isActive={item.path === currentRoute}
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
                      'text-muted-foreground hover:bg-accent hover:text-foreground',
                      'px-2 py-2.5',
                    )}
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
                        isActive={gitem.path === currentRoute}
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
                  className={cn(
                    'relative flex items-center rounded-lg text-sm font-medium transition-all w-full',
                    'text-muted-foreground hover:bg-accent hover:text-foreground',
                    groupOpen && 'bg-accent text-foreground',
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
                <div className="mt-1 pl-2">
                  <div className="flex flex-col gap-1">
                    {groupedItems.map(gitem => (
                      <NavItem
                        key={gitem.path || gitem.translationKey}
                        item={gitem}
                        isActive={gitem.path === currentRoute}
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
