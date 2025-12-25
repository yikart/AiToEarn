/**
 * NavSection - 侧边栏主导航区域
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, PlusCircle } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { useGetClientLng } from '@/hooks/useSystem'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { NavSectionProps, NavItemData, SidebarCommonProps } from '../types'

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

/** Add Channel 按钮 */
interface AddChannelButtonProps extends SidebarCommonProps {
  onClick: () => void
}

function AddChannelButton({ collapsed, onClick }: AddChannelButtonProps) {
  const { t } = useTransClient('route')

  const content = (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center rounded-lg text-sm font-medium transition-all w-full',
        'text-primary hover:bg-primary/10 hover:text-primary',
        'border border-dashed border-primary/40 hover:border-primary',
        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
      )}
    >
      <span className="flex shrink-0 items-center justify-center text-primary">
        <PlusCircle size={20} />
      </span>
      {!collapsed && (
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {t('addChannel')}
        </span>
      )}
    </button>
  )

  // 收缩状态下显示 Tooltip
  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{t('addChannel')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

interface NavSectionWithAddChannelProps extends NavSectionProps {
  onAddChannel?: () => void
}

export function NavSection({ items, currentRoute, collapsed, onAddChannel }: NavSectionWithAddChannelProps) {
  // Move Add Channel to be the second item (under Home)
  const addChannelInsertIndex = 1

  // Keys to group into a collapsed section
  const groupKeys = [
    'tasksHistory',
    'dataStatistics',
    'header.materialLibrary',
    'header.draftBox',
  ]

  const groupedItems = items.filter(i => groupKeys.includes(i.translationKey as string))
  const otherItems = items.filter(i => !groupKeys.includes(i.translationKey as string))

  const [groupOpen, setGroupOpen] = useState(false)
  const { t } = useTransClient('route')

  // Auto-expand group if current route is in the grouped items
  useEffect(() => {
    const isCurrentRouteInGroup = groupedItems.some(item => item.path === currentRoute)
    if (isCurrentRouteInGroup && !groupOpen) {
      setGroupOpen(true)
    }
  }, [currentRoute, groupedItems, groupOpen])

  return (
    <nav className="flex flex-col gap-1">
      {otherItems.map((item, index) => {
        // Render first item (Home)
        if (index === 0) {
          return (
            <div key={item.path || item.translationKey}>
              <NavItem
                item={item}
                isActive={item.path === currentRoute}
                collapsed={collapsed}
              />
              {/* Insert Add Channel right after first item */}
              {onAddChannel && (
                <div className="mt-1">
                  <AddChannelButton collapsed={collapsed} onClick={onAddChannel} />
                </div>
              )}
            </div>
          )
        }

        // For other items (excluding the grouped ones), render normally
        return (
          <div key={item.path || item.translationKey}>
            <NavItem
              item={item}
              isActive={item.path === currentRoute}
              collapsed={collapsed}
            />
          </div>
        )
      })}

      {/* Collapsible group for Task History / Data / Library / Drafts */}
      {groupedItems.length > 0 && (
        <div>
          <div className="mt-1">
            <button
              onClick={() => setGroupOpen((s) => !s)}
              className={cn(
                'relative flex items-center rounded-lg text-sm font-medium transition-all w-full',
                'text-muted-foreground hover:bg-accent hover:text-foreground',
                groupOpen && 'bg-accent text-foreground',
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
              )}
            >
              <span className="flex shrink-0 items-center justify-center">
                <FileText size={20} />
              </span>
              {!collapsed && (
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {/* Use a generic label for the grouped section */}
                  {t('sidebar.more')}
                </span>
              )}
              {/* Show expand/collapse indicator in collapsed mode */}
              {collapsed && (
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs opacity-60">
                  {groupOpen ? '−' : '+'}
                </span>
              )}
            </button>
          </div>

          {/* Expand list when open - show in both collapsed and expanded states */}
          {groupOpen && (
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                groupOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
                collapsed ? 'mt-1' : 'mt-1 pl-2'
              )}
            >
              <div className="flex flex-col gap-1">
                {groupedItems.map((gitem) => (
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
        </div>
      )}
    </nav>
  )
}

