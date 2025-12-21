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
function UserAvatar({ collapsed, onOpenSettings }: { collapsed: boolean; onOpenSettings: () => void }) {
  const userInfo = useUserStore(state => state.userInfo)
  const { t } = useTransClient('common')

  if (!userInfo) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onOpenSettings}
            className={cn(
              'flex w-full cursor-pointer items-center rounded-lg border-none bg-transparent transition-colors hover:bg-accent',
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
          </button>
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

export function UserSection({ collapsed, onLogin, onOpenSettings }: UserSectionProps) {
  const token = useUserStore(state => state.token)
  const { t } = useTransClient('common')

  if (token) {
    return <UserAvatar collapsed={collapsed} onOpenSettings={() => onOpenSettings()} />
  }

  // 未登录状态
  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onLogin} size="icon" className="h-9 w-9">
              <span className="text-sm font-semibold">In</span>
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

