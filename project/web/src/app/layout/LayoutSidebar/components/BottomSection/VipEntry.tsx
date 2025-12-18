/**
 * VipEntry - VIP 会员入口组件
 */

'use client'

import Link from 'next/link'
import { Crown } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { useGetClientLng } from '@/hooks/useSystem'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SidebarCommonProps } from '../../types'

export function VipEntry({ collapsed }: SidebarCommonProps) {
  const { t } = useTransClient('common')
  const lng = useGetClientLng()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/${lng}/pricing`}
            className={cn(
              'flex items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              collapsed ? 'h-9 w-9 justify-center' : 'justify-between px-3 py-2',
            )}
          >
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-warning" />
              {!collapsed && <span className="text-sm">{t('vip')}</span>}
            </div>
            {!collapsed && <span className="text-xs text-muted-foreground">{t('subscribe')}</span>}
          </Link>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right">
            <p>{t('vip')}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

