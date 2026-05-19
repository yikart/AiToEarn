/**
 * UserProfileCard - 用户资料卡
 */
import type { TwitterUser } from '@/api/types/twitter'
import { X } from 'lucide-react'
import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/utils/format'

interface UserProfileCardProps {
  user: TwitterUser
  onViewPosts: () => void
  onClear: () => void
}

export default function UserProfileCard({ user, onViewPosts, onClear }: UserProfileCardProps) {
  const { t } = useTransClient('account')
  const metrics = user.publicMetrics

  return (
    <div className="mx-4 mt-3 p-4 rounded-lg border border-border bg-muted/30 relative">
      <Button variant="ghost" size="sm" onClick={onClear} className="absolute top-2 right-2 h-6 w-6 p-0 cursor-pointer">
        <X className="h-3.5 w-3.5" />
      </Button>

      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={user.profileImageUrl} alt={user.name} />
          <AvatarFallback>{user.name?.[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold truncate">{user.name}</span>
            {user.verified && <span className="text-primary" title={t('twitter.verified')}>&#10003;</span>}
          </div>
          <div className="text-sm text-muted-foreground">
            @
            {user.username}
          </div>

          {metrics && (
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{formatNumber(metrics.followingCount ?? 0)}</strong>
                {' '}
                {t('twitter.following')}
              </span>
              <span>
                <strong className="text-foreground">{formatNumber(metrics.followersCount ?? 0)}</strong>
                {' '}
                {t('twitter.followers')}
              </span>
              <span>
                <strong className="text-foreground">{formatNumber(metrics.tweetCount ?? 0)}</strong>
                {' '}
                {t('twitter.tweets')}
              </span>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={onViewPosts} className="mt-2 h-7 text-xs cursor-pointer">
            {t('twitter.viewPosts')}
          </Button>
        </div>
      </div>
    </div>
  )
}
