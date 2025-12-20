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
import { useUserStore } from '@/store/user'
import type { SidebarCommonProps } from '../../types'

export function VipEntry({ collapsed }: SidebarCommonProps) {
  const { t } = useTransClient('common')
  const lng = useGetClientLng()
  const userInfo = useUserStore(state => state.userInfo)

  // 判断用户是否是有效会员
  const isVip = userInfo?.vipInfo?.expireTime && new Date(userInfo.vipInfo.expireTime) > new Date()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/${lng}/pricing`}
            className={cn(
              'flex flex-col rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              collapsed ? 'h-9 w-9 items-center justify-center' : 'px-3 py-2',
            )}
          >
            <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between w-full')}>
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-warning" />
                {!collapsed && <span className="text-sm">{t('vip')}</span>}
              </div>
              {!collapsed && !isVip && (
                <span className="text-xs text-muted-foreground">{t('subscribe')}</span>
              )}
            </div>
            {!collapsed && !isVip && (
              <div className="mt-1 ml-[26px]">
                <span className="text-[10px] text-orange-500 font-medium">$19→$50 Credits</span>
              </div>
            )}
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

