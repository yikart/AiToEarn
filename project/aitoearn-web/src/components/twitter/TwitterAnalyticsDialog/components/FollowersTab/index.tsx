/**
 * FollowersTab - 粉丝列表 Tab
 */
import type { TwitterUser } from '@/api/types/twitter'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatNumber } from '@/utils/format'
import { useFollowers } from '../../hooks/useFollowers'

export default function FollowersTab() {
  const { t } = useTransClient('account')
  const { followers, fetchFollowers } = useFollowers()
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (followers.users.length === 0 && !followers.loading) {
      fetchFollowers(true)
    }
  }, [])

  const lastUserRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (followers.loading)
        return
      if (observerRef.current)
        observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && followers.hasMore) {
          fetchFollowers(false)
        }
      })

      if (node)
        observerRef.current.observe(node)
    },
    [followers.loading, followers.hasMore, fetchFollowers],
  )

  if (followers.users.length === 0 && followers.loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (followers.users.length === 0 && !followers.loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-12">
        {t('twitter.noUsers')}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {followers.users.map((user, i) => {
        const isLast = i === followers.users.length - 1
        return (
          <div key={user.id} ref={isLast ? lastUserRef : undefined}>
            <UserListItem user={user} />
          </div>
        )
      })}

      {followers.loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

function UserListItem({ user }: { user: TwitterUser }) {
  const { t } = useTransClient('account')
  const metrics = user.publicMetrics

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-accent/30 transition-colors">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={user.profileImageUrl} alt={user.name} />
        <AvatarFallback>{user.name?.[0] || '?'}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold truncate">{user.name || t('twitter.unknown')}</span>
          {user.verified && (
            <span className="text-primary shrink-0" title={t('twitter.verified')}>&#10003;</span>
          )}
          <span className="text-muted-foreground truncate">
            @
            {user.username || t('twitter.unknown')}
          </span>
        </div>

        {metrics && (
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
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
          </div>
        )}
      </div>
    </div>
  )
}
