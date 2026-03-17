/**
 * AffiliatesEntry - 推广赚钱入口组件
 */

'use client'

import type { SidebarCommonProps } from '../../types'
import { Share2 } from 'lucide-react'
import Link from 'next/link'
import { useTransClient } from '@/app/i18n/client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function AffiliatesEntry({ collapsed }: SidebarCommonProps) {
  const { t } = useTransClient('common')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/affiliates"
            className={cn(
              'flex items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              collapsed ? 'h-9 w-9 justify-center' : 'justify-between px-3 py-2',
            )}
          >
            <div className="flex items-center gap-2">
              <Share2 size={18} className="text-primary" />
              {!collapsed && <span className="text-sm">{t('affiliates')}</span>}
            </div>
          </Link>
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
