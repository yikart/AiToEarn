/**
 * AffiliatesEntry - 推广赚钱入口组件
 */

'use client'

import type { SidebarCommonProps } from '../../types'
import { Share2 } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const AFFILIATES_URL = 'https://aitoearn.getrewardful.com/signup?_gl=1*15wk8k8*_gcl_au*MjAzNTIwODgyMi4xNzY1MjkwMjc2LjExMjI2NzUyNDguMTc2NjE1MjM5OS4xNzY2MTUzODYz*_ga*OTk1MTc5MzQzLjE3NjUyOTAyNzY.*_ga_YJYFH7ZS27*czE3NjYxNTIzOTIkbzckZzEkdDE3NjYxNTM4OTQkajQ3JGwwJGgxODk3OTAxMTc1'

export function AffiliatesEntry({ collapsed }: SidebarCommonProps) {
  const { t } = useTransClient('common')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={AFFILIATES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              collapsed ? 'h-9 w-9 justify-center' : 'justify-between px-3 py-2',
            )}
          >
            <div className="flex items-center gap-2">
              <Share2 size={18} className="text-primary" />
              {!collapsed && <span className="text-sm">{t('affiliates')}</span>}
            </div>
          </a>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right">
            <p>{t('affiliates')}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
