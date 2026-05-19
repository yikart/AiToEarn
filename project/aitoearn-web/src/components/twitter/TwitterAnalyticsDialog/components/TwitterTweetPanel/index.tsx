import type { TwitterTweetPageLoader } from '../../types'
/**
 * TwitterTweetPanel - Twitter 推文资源列表
 * 统一承载时间线、搜索结果、书签、喜欢、提及等推文分页数据。
 */
import type { TwitterMediaItem, TwitterPaginationMeta, TwitterTweet, TwitterUser } from '@/api/types/twitter'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTransClient } from '@/app/i18n/client'
import TweetCard, { findTweetMedia, findTweetUser } from '@/components/twitter/TweetCard'
import TweetCardSkeleton from '@/components/twitter/TweetCardSkeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TwitterTweetPanelProps {
  title: string
  description?: string
  loadPage: TwitterTweetPageLoader
  accountId: string
  reloadKey?: string
  emptyText?: string
  initialBookmarked?: boolean
  initialLiked?: boolean
  initialRetweeted?: boolean
  onTweetClick: (tweetId: string) => void
  className?: string
}

export default function TwitterTweetPanel({
  title,
  description,
  loadPage,
  accountId,
  reloadKey,
  emptyText,
  initialBookmarked,
  initialLiked,
  initialRetweeted,
  onTweetClick,
  className,
}: TwitterTweetPanelProps) {
  const { t } = useTransClient('account')
  const [tweets, setTweets] = useState<TwitterTweet[]>([])
  const [users, setUsers] = useState<TwitterUser[]>([])
  const [media, setMedia] = useState<TwitterMediaItem[]>([])
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
      setTweets([])
      setUsers([])
      setMedia([])
      setMeta(undefined)
    }

    const paginationToken = reset ? undefined : meta?.nextToken
    const res = await loadPageRef.current(paginationToken)

    if (res?.code === 0 && res.data) {
      const nextTweets = res.data.data ?? []
      const nextUsers = res.data.includes?.users ?? []
      const nextMedia = res.data.includes?.media ?? []
      setTweets(current => reset ? nextTweets : [...current, ...nextTweets])
      setUsers(current => reset ? nextUsers : mergeUsers(current, nextUsers))
      setMedia(current => reset ? nextMedia : [...current, ...nextMedia])
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
      setTweets([])
      setUsers([])
      setMedia([])
      setMeta(undefined)

      const res = await loadPageRef.current()
      if (cancelled)
        return

      if (res?.code === 0 && res.data) {
        setTweets(res.data.data ?? [])
        setUsers(res.data.includes?.users ?? [])
        setMedia(res.data.includes?.media ?? [])
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

  const lastTweetRef = useCallback((node: HTMLDivElement | null) => {
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchPage(true)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t('twitter.refresh')}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tweets.length === 0 && loading && (
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <TweetCardSkeleton key={index} />
            ))}
          </>
        )}

        {tweets.length === 0 && !loading && !error && (
          <div className="flex h-full min-h-[260px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {emptyText || t('twitter.noTweets')}
          </div>
        )}

        {tweets.length === 0 && !loading && error && (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 px-6 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => fetchPage(true)}>
              {t('twitter.retry')}
            </Button>
          </div>
        )}

        {tweets.map((tweet, index) => {
          const isLast = index === tweets.length - 1
          const user = findTweetUser(tweet, users)
          const tweetMedia = findTweetMedia(tweet, media)
          const quotedRef = tweet.referencedTweets?.find(item => item.type === 'quoted')
          const quotedTweet = quotedRef ? tweets.find(item => item.id === quotedRef.id) : undefined
          const quotedUser = quotedTweet ? findTweetUser(quotedTweet, users) : undefined
          const quotedMedia = quotedTweet ? findTweetMedia(quotedTweet, media) : undefined

          return (
            <div key={`${tweet.id}-${index}`} ref={isLast ? lastTweetRef : undefined}>
              <TweetCard
                tweet={tweet}
                user={user}
                media={tweetMedia}
                quotedTweet={quotedTweet ? { tweet: quotedTweet, user: quotedUser, media: quotedMedia } : undefined}
                accountId={accountId}
                onClick={() => onTweetClick(tweet.id)}
                initialBookmarked={initialBookmarked}
                initialLiked={initialLiked}
                initialRetweeted={initialRetweeted}
              />
            </div>
          )
        })}

        {tweets.length > 0 && loading && (
          <div className="flex items-center justify-center py-5">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </section>
  )
}
