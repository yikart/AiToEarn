/**
 * ConfigManagerEntry - 配置管理入口组件
 */
'use client'

import type { SidebarCommonProps } from '../../types'
import { SlidersHorizontal } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useConfigManagerDialogStore } from '@/store/configManagerDialog'
import { cn } from '@/utils/className'

export function ConfigManagerEntry({ collapsed }: SidebarCommonProps) {
  const { t } = useTransClient('common')
  const openDialog = useConfigManagerDialogStore(state => state.openDialog)

  const content = (
    <button
      type="button"
      onClick={() => openDialog('sidebar')}
      data-testid="sidebar-config-manager"
      className={cn(
        'flex flex-1 cursor-pointer items-center rounded-lg text-muted-foreground transition-colors hover:bg-brand-cyan/10 hover:text-brand-cyan',
        collapsed ? 'h-9 w-9 justify-center' : 'justify-between px-3 py-2',
      )}
    >
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-brand-cyan" />
        {!collapsed && <span className="text-sm">{t('configManagement')}</span>}
      </div>
    </button>
  )

  if (!collapsed)
    return content

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{t('configManagement')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
