/**
 * IconBar - 底部图标栏（邮箱、下载APP、通知）
 */

'use client'

import type { IconBarProps } from '../types'
import { Bell, Mail, Settings, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import DownloadAppModal from '@/components/common/DownloadAppModal'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CONTACT } from '@/constant'
import { cn } from '@/lib/utils'

export function IconBar({ collapsed, isLoggedIn, unreadCount, onOpenNotification, onOpenSettings }: IconBarProps) {
  const { t } = useTransClient('common')
  const [downloadModalVisible, setDownloadModalVisible] = useState(false)

  return (
    <div
      className={cn(
        'mt-2 flex items-center justify-center border-t border-sidebar-border pt-2',
        collapsed ? 'flex-col gap-1' : 'flex-row gap-0',
      )}
    >
      {/* 设置 - 第一个位置 */}
      {/* <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-muted-foreground/70 transition-colors hover:bg-accent hover:text-muted-foreground"
              onClick={() => onOpenSettings()}
            >
              <Settings size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side={collapsed ? 'right' : 'top'}
            className="bg-popover text-popover-foreground"
          >
            <p>{t('settings')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider> */}

      {/* 邮箱 - 联系我们 */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={`mailto:${CONTACT}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-accent hover:text-muted-foreground"
            >
              <Mail size={18} />
            </a>
          </TooltipTrigger>
          <TooltipContent
            side={collapsed ? 'right' : 'top'}
            className="bg-popover text-popover-foreground"
          >
            <p>
              {t('contactUs')}
              :
              {' '}
              {CONTACT}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 手机 - 下载APP */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-muted-foreground/70 transition-colors hover:bg-accent hover:text-muted-foreground"
              onClick={() => setDownloadModalVisible(true)}
            >
              <Smartphone size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side={collapsed ? 'right' : 'top'}
            className="bg-popover text-popover-foreground"
          >
            <p>{t('downloadAppButton')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 通知 - 仅登录后显示 */}
      {isLoggedIn && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-muted-foreground/70 transition-colors hover:bg-accent hover:text-muted-foreground"
                onClick={onOpenNotification}
              >
                {unreadCount > 0 ? (
                  <div className="relative flex items-center justify-center">
                    <Bell size={18} />
                    <Badge
                      variant="destructive"
                      className="absolute -right-2 -top-2 h-[18px] min-w-[18px] px-1 text-[10px] leading-[18px]"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  </div>
                ) : (
                  <Bell size={18} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side={collapsed ? 'right' : 'top'}
              className="bg-popover text-popover-foreground"
            >
              <p>{t('notifications')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 下载APP弹窗 */}
      <DownloadAppModal
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
      />
    </div>
  )
}
