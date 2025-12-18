/**
 * SettingsEntry - 设置入口组件
 */

'use client'

import { Settings } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SidebarCommonProps } from '../../types'

interface SettingsEntryProps extends SidebarCommonProps {
  onClick: () => void
}

export function SettingsEntry({ collapsed, onClick }: SettingsEntryProps) {
  const { t } = useTransClient('common')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'flex cursor-pointer items-center rounded-lg border-none bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              collapsed ? 'h-9 w-9 justify-center' : 'gap-2 px-3 py-2',
            )}
          >
            <Settings size={18} />
            {!collapsed && <span className="text-sm">{t('settings')}</span>}
          </button>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right">
            <p>{t('settings')}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

