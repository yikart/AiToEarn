/**
 * NavSection - 侧边栏主导航区域
 */

'use client'

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
          {t(item.translationKey as any)}
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
            <p>{t(item.translationKey as any)}</p>
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
          {t('addChannel' as any)}
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
            <p>{t('addChannel' as any)}</p>
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
  // 在 "互动数据" 后面插入 Add Channel 按钮 (index 3，即第4个位置)
  const interactiveIndex = items.findIndex(item => item.translationKey === 'interactive')
  const insertIndex = interactiveIndex !== -1 ? interactiveIndex + 1 : 4

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item, index) => (
        <div key={item.path || item.translationKey}>
          <NavItem
            item={item}
            isActive={item.path === currentRoute}
            collapsed={collapsed}
          />
          {/* 在指定位置插入 Add Channel 按钮 */}
          {index === insertIndex - 1 && onAddChannel && (
            <div className="mt-1">
              <AddChannelButton collapsed={collapsed} onClick={onAddChannel} />
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}

