import type { TwitterUserPageLoader } from '../../types'
/**
 * TwitterUserPanel - Twitter 用户资源列表
 * 统一承载 followers、following、blocks、mutes 等用户分页数据。
 */
import type { TwitterPaginationMeta, TwitterUser } from '@/api/types/twitter'
import { AlertCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/format'

interface TwitterUserPanelProps {
  title: string
  description?: string
  loadPage: TwitterUserPageLoader
  reloadKey?: string
  emptyText?: string
  onUserClick?: (user: TwitterUser) => void
  className?: string
}

export default function TwitterUserPanel({
  title,
  description,
  loadPage,
  reloadKey,
  emptyText,
  onUserClick,
  className,
}: TwitterUserPanelProps) {
  const { t } = useTransClient('account')
  const [users, setUsers] = useState<TwitterUser[]>([])
  const [meta, setMeta] = useState<TwitterPaginationMeta | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadPageRef = useRef(loadPage)
  const hasMore = Boolean(meta?.nextToken)

  useEffect(() => {
    loadPageRef.current = loadPage
  }, [loadPage])

  const mergeUsers = useCallback((current: TwitterUser[], incoming: TwitterUser[]) => {
    const map = new Map(current.map(user => [user.id, user]))
    for (const user of incoming) {
      map.set(user.id, user)
    }
    return Array.from(map.values())
  }, [])

  const fetchPage = useCallback(async (reset = false) => {
    if (loading)
      return
    if (!reset && !hasMore)
      return

    setLoading(true)
    setError('')
    if (reset) {
      setUsers([])
      setMeta(undefined)
    }

    const paginationToken = reset ? undefined : meta?.nextToken
    const res = await loadPageRef.current(paginationToken)

    if (res?.code === 0 && res.data) {
      setUsers(current => reset ? (res.data.data ?? []) : mergeUsers(current, res.data.data ?? []))
      setMeta(res.data.meta)
    }
    else {
      setError(res?.message || t('twitter.loadFailed'))
    }
    setLoading(false)
  }, [hasMore, loading, mergeUsers, meta?.nextToken, t])

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      setLoading(true)
      setError('')
      setUsers([])
      setMeta(undefined)

      const res = await loadPageRef.current()
      if (cancelled)
        return

      if (res?.code === 0 && res.data) {
        setUsers(res.data.data ?? [])
        setMeta(res.data.meta)
      }
      else {
        setError(res?.message || t('twitter.loadFailed'))
      }
      setLoading(false)
    }

    loadInitial()

    return () => {
      cancelled = true
    }
  }, [reloadKey, t])

  const lastUserRef = useCallback((node: HTMLDivElement | null) => {
    if (loading)
      return
    if (observerRef.current)
      observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        fetchPage(false)
      }
    })

    if (node)
      observerRef.current.observe(node)
  }, [fetchPage, hasMore, loading])

  return (
    <section className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => fetchPage(true)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t('twitter.refresh')}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {users.length === 0 && loading && (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, index) => (
              <UserRowSkeleton key={index} />
            ))}
          </div>
        )}

        {users.length === 0 && !loading && !error && (
          <div className="flex h-full min-h-[260px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {emptyText || t('twitter.noUsers')}
          </div>
        )}

        {users.length === 0 && !loading && error && (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 px-6 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => fetchPage(true)}>
              {t('twitter.retry')}
            </Button>
          </div>
        )}

        {users.map((user, index) => {
          const isLast = index === users.length - 1
          return (
            <div key={user.id} ref={isLast ? lastUserRef : undefined}>
              <UserRow user={user} onClick={onUserClick ? () => onUserClick(user) : undefined} />
            </div>
          )
        })}

        {users.length > 0 && loading && (
          <div className="flex items-center justify-center py-5">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </section>
  )
}

export function UserRow({ user, onClick, className }: { user: TwitterUser, onClick?: () => void, className?: string }) {
  const { t } = useTransClient('account')
  const metrics = user.publicMetrics

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors',
        onClick ? 'cursor-pointer hover:bg-accent/40' : 'cursor-default',
        className,
      )}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={user.profileImageUrl} alt={user.name} />
        <AvatarFallback>{user.name?.[0] || '?'}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="truncate font-semibold text-foreground">{user.name || t('twitter.unknown')}</span>
          {user.verified && (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label={t('twitter.verified')} />
          )}
          <span className="truncate text-muted-foreground">
            @
            {user.username || t('twitter.unknown')}
          </span>
        </div>
        {metrics && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {formatNumber(metrics.followingCount ?? 0)}
              {' '}
              {t('twitter.following')}
            </span>
            <span>
              {formatNumber(metrics.followersCount ?? 0)}
              {' '}
              {t('twitter.followers')}
            </span>
            <span>
              {formatNumber(metrics.tweetCount ?? 0)}
              {' '}
              {t('twitter.tweets')}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

function UserRowSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b border-border px-4 py-3">
      <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-3 w-56 rounded bg-muted" />
      </div>
    </div>
  )
}
