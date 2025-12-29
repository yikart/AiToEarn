/**
 * MyChannelsEntry - 我的频道入口组件
 */

'use client'

import type { SidebarCommonProps } from '../../types'
import { Tv } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { useChannelManagerStore } from '@/components/ChannelManager'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function MyChannelsEntry({ collapsed }: SidebarCommonProps) {
  const { t } = useTransClient('account')
  const openModal = useChannelManagerStore(state => state.openModal)

  const handleClick = () => {
    openModal()
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              'flex flex-1 cursor-pointer items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              collapsed ? 'h-9 w-9 justify-center' : 'justify-between px-3 py-2',
            )}
          >
            <div className="flex items-center gap-2">
              <Tv size={18} className="text-primary" />
              {!collapsed && <span className="text-sm">{t('channelManager.myChannels')}</span>}
            </div>
          </button>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right">
            <p>{t('channelManager.myChannels')}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
