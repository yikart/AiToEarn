/**
 * UserSection - 用户头像/登录按钮区域
 */

'use client'

import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user'
import { getOssUrl } from '@/utils/oss'
import type { UserSectionProps } from '../types'

/** 用户头像组件 */
function UserAvatar({ collapsed }: { collapsed: boolean }) {
  const userInfo = useUserStore(state => state.userInfo)
  const { t } = useTransClient('common')

  if (!userInfo) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center rounded-lg',
              collapsed ? 'justify-center p-1' : 'gap-2 px-2 py-1.5',
            )}
          >
            <Avatar className="h-8 w-8 shrink-0 border-2 border-border">
              <AvatarImage
                src={getOssUrl(userInfo.avatar) || ''}
                alt={userInfo.name || t('unknownUser')}
              />
              <AvatarFallback className="bg-muted-foreground font-semibold text-background">
                {userInfo.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <span className="truncate text-sm font-medium text-foreground">
                {userInfo.name || t('unknownUser')}
              </span>
            )}
          </div>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right">
            <p>{t('profile')}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

export function UserSection({ collapsed, onLogin }: UserSectionProps) {
  const token = useUserStore(state => state.token)
  const { t } = useTransClient('common')

  if (token) {
    return <UserAvatar collapsed={collapsed} />
  }

  // 未登录状态
  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onLogin} size="icon" className="h-9 w-9">
              <span className="text-sm font-semibold">登</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{t('login')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button onClick={onLogin} className="mt-1 w-full">
      {t('login')}
    </Button>
  )
}

