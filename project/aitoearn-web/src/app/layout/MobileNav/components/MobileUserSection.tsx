import type { MobileUserSectionProps } from '../types'
/**
 * MobileUserSection - 移动端用户头像/登录区域
 */
import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/user'
import { navigateToLogin } from '@/utils/auth'
import { getOssUrl } from '@/utils/oss'

export function MobileUserSection({
  onClose,
  onOpenSettings,
}: MobileUserSectionProps) {
  const { t } = useTransClient('common')
  const token = useUserStore(state => state.token)
  const userInfo = useUserStore(state => state.userInfo)

  const handleLogin = () => {
    onClose()
    navigateToLogin()
  }

  if (token && userInfo) {
    const handleClick = () => {
      onClose()
      onOpenSettings()
    }

    return (
      <button
        onClick={handleClick}
        data-testid="mobile-user-btn"
        className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        <Avatar className="h-8 w-8 shrink-0 border border-border">
          <AvatarImage src={getOssUrl(userInfo.avatar) || ''} alt={userInfo.name || t('unknownUser')} />
          <AvatarFallback className="bg-muted-foreground font-semibold text-background">
            {userInfo.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col items-start">
          <span className="truncate text-sm font-medium text-foreground" data-testid="mobile-user-name">
            {userInfo.name || t('unknownUser')}
          </span>
        </div>
      </button>
    )
  }

  return (
    <Button onClick={handleLogin} className="w-full cursor-pointer" data-testid="mobile-login-btn">
      {t('login')}
    </Button>
  )
}
