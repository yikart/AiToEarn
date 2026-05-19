/**
 * TweetCard - 推文展示卡片
 * 展示推文内容、媒体、指标，支持引用推文递归渲染
 * 支持互动操作（点赞/转推/收藏），带乐观更新
 */
import type { TwitterMediaItem, TwitterTweet, TwitterUser } from '@/api/types/twitter'
import { Bookmark, Eye, Heart, Loader2, MessageCircle, Play, Quote, Repeat2, ShieldCheck } from 'lucide-react'
import NextImage from 'next/image'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { apiTwitterBookmark, apiTwitterBookmarkRemove, apiTwitterLike, apiTwitterRepost, apiTwitterRepostUndo, apiTwitterUnlike } from '@/api/plat/twitter'
import { useTransClient } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/lib/toast'
import { cn, formatRelativeTime } from '@/lib/utils'
import { formatNumber } from '@/utils/format'

export interface TweetCardProps {
  tweet: TwitterTweet
  user?: TwitterUser
  media?: TwitterMediaItem[]
  /** 引用的推文数据（包含用户和媒体） */
  quotedTweet?: {
    tweet: TwitterTweet
    user?: TwitterUser
    media?: TwitterMediaItem[]
  }
  compact?: boolean
  onClick?: () => void
  className?: string
  /** 账号 ID，提供后启用互动按钮 */
  accountId?: string
  /** 互动操作回调，通知父组件刷新 */
  onTweetAction?: (action: string, tweetId: string) => void
  /** 初始收藏状态（书签 Tab 使用） */
  initialBookmarked?: boolean
  /** 初始点赞状态（喜欢 Tab 使用） */
  initialLiked?: boolean
  /** 初始转推状态 */
  initialRetweeted?: boolean
}

/** 从 tweet.authorId 匹配 includes.users */
export function findTweetUser(tweet: TwitterTweet, users?: TwitterUser[]): TwitterUser | undefined {
  return users?.find(u => u.id === tweet.authorId)
}

/** 从 tweet.attachments.mediaKeys 匹配 includes.media */
export function findTweetMedia(tweet: TwitterTweet, mediaItems?: TwitterMediaItem[]): TwitterMediaItem[] {
  const keys = tweet.attachments?.mediaKeys ?? []
  if (keys.length && mediaItems) {
    return keys.map(key => mediaItems.find(m => m.mediaKey === key)).filter(Boolean) as TwitterMediaItem[]
  }
  return tweet.mediaMetadata ?? []
}

/** 解析推文中的链接为可点击元素 */
function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/\S+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          onClick={e => e.stopPropagation()}
        >
          {part}
        </a>
      )
    }
    return part
  })
}

/** 媒体网格：1张全宽、2张各半、3张 2+1、4张 2x2 */
function MediaGrid({ media }: { media: TwitterMediaItem[] }) {
  if (!media.length)
    return null

  const count = Math.min(media.length, 4)

  if (count === 1) {
    return (
      <div className="mt-3 rounded-lg overflow-hidden border border-border">
        <MediaItem item={media[0]} className="w-full max-h-[400px] object-cover" />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-0.5 rounded-lg overflow-hidden border border-border">
        {media.slice(0, 2).map(item => (
          <MediaItem key={item.mediaKey} item={item} className="w-full h-[200px] object-cover" />
        ))}
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-0.5 rounded-lg overflow-hidden border border-border">
        <MediaItem item={media[0]} className="w-full h-[280px] object-cover row-span-2" />
        <MediaItem item={media[1]} className="w-full h-[139px] object-cover" />
        <MediaItem item={media[2]} className="w-full h-[139px] object-cover" />
      </div>
    )
  }

  // 4张 2x2
  return (
    <div className="mt-3 grid grid-cols-2 gap-0.5 rounded-lg overflow-hidden border border-border">
      {media.slice(0, 4).map(item => (
        <MediaItem key={item.mediaKey} item={item} className="w-full h-[200px] object-cover" />
      ))}
    </div>
  )
}

function MediaItem({ item, className }: { item: TwitterMediaItem, className?: string }) {
  const isVideo = item.type === 'video' || item.type === 'animated_gif'
  const src = item.url || item.previewImageUrl

  if (!src)
    return null

  return (
    <div className="relative">
      <NextImage
        src={src}
        alt={item.altText ?? ''}
        width={item.width ?? 1200}
        height={item.height ?? 675}
        className={className}
        unoptimized
      />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm">
            <Play className="h-6 w-6 fill-current" />
          </div>
        </div>
      )}
    </div>
  )
}

/** 互动按钮组件 */
function ActionButton({
  icon: Icon,
  count,
  active,
  loading,
  onClick,
  title,
}: {
  icon: React.ElementType
  count: number
  active?: boolean
  loading?: boolean
  onClick?: (e: React.MouseEvent) => void
  title?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-1 text-xs transition-colors cursor-pointer',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        loading && 'opacity-50 pointer-events-none',
      )}
      onClick={onClick}
      title={title}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className={cn('h-3.5 w-3.5', active && 'fill-current')} />
      )}
      {formatNumber(count)}
    </button>
  )
}

const TweetCard = memo(({
  tweet,
  user,
  media,
  quotedTweet,
  compact,
  onClick,
  className,
  accountId,
  onTweetAction,
  initialBookmarked,
  initialLiked,
  initialRetweeted,
}: TweetCardProps) => {
  const { t } = useTransClient('account')
  const tweetMedia = useMemo(() => media ?? tweet.mediaMetadata ?? [], [media, tweet.mediaMetadata])
  const [metrics, setMetrics] = useState(tweet.publicMetrics)
  const timeAgo = tweet.createdAt ? formatRelativeTime(new Date(tweet.createdAt).getTime()) : ''

  // 互动状态（乐观更新）
  const [liked, setLiked] = useState(initialLiked ?? false)
  const [retweeted, setRetweeted] = useState(initialRetweeted ?? false)
  const [bookmarked, setBookmarked] = useState(initialBookmarked ?? false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const showActions = !compact && accountId

  useEffect(() => {
    setMetrics(tweet.publicMetrics)
  }, [tweet.publicMetrics])

  useEffect(() => {
    setLiked(initialLiked ?? false)
  }, [initialLiked])

  useEffect(() => {
    setRetweeted(initialRetweeted ?? false)
  }, [initialRetweeted])

  useEffect(() => {
    setBookmarked(initialBookmarked ?? false)
  }, [initialBookmarked])

  const bumpMetric = useCallback((key: keyof NonNullable<TwitterTweet['publicMetrics']>, delta: number) => {
    setMetrics(current => ({
      ...current,
      [key]: Math.max(0, (current?.[key] ?? 0) + delta),
    }))
  }, [])

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!accountId || actionLoading)
      return
    const prev = liked
    setLiked(!prev)
    bumpMetric('likeCount', prev ? -1 : 1)
    setActionLoading('like')
    try {
      const res = prev
        ? await apiTwitterUnlike({ accountId, tweetId: tweet.id })
        : await apiTwitterLike({ accountId, tweetId: tweet.id })
      if (res?.code !== 0) {
        setLiked(prev)
        bumpMetric('likeCount', prev ? 1 : -1)
        toast.error(res?.message || t('twitter.failed'))
      }
      else {
        onTweetAction?.('like', tweet.id)
      }
    }
    catch {
      setLiked(prev)
      bumpMetric('likeCount', prev ? 1 : -1)
    }
    setActionLoading(null)
  }, [accountId, tweet.id, liked, actionLoading, onTweetAction, bumpMetric, t])

  const handleRetweet = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!accountId || actionLoading)
      return
    const prev = retweeted
    setRetweeted(!prev)
    bumpMetric('retweetCount', prev ? -1 : 1)
    setActionLoading('retweet')
    try {
      const res = prev
        ? await apiTwitterRepostUndo({ accountId, tweetId: tweet.id })
        : await apiTwitterRepost({ accountId, tweetId: tweet.id })
      if (res?.code !== 0) {
        setRetweeted(prev)
        bumpMetric('retweetCount', prev ? 1 : -1)
        toast.error(res?.message || t('twitter.failed'))
      }
      else {
        onTweetAction?.('retweet', tweet.id)
      }
    }
    catch {
      setRetweeted(prev)
      bumpMetric('retweetCount', prev ? 1 : -1)
    }
    setActionLoading(null)
  }, [accountId, tweet.id, retweeted, actionLoading, onTweetAction, bumpMetric, t])

  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!accountId || actionLoading)
      return
    const prev = bookmarked
    setBookmarked(!prev)
    bumpMetric('bookmarkCount', prev ? -1 : 1)
    setActionLoading('bookmark')
    try {
      const res = prev
        ? await apiTwitterBookmarkRemove({ accountId, tweetId: tweet.id })
        : await apiTwitterBookmark({ accountId, tweetId: tweet.id })
      if (res?.code !== 0) {
        setBookmarked(prev)
        bumpMetric('bookmarkCount', prev ? 1 : -1)
        toast.error(res?.message || t('twitter.failed'))
      }
      else {
        onTweetAction?.('bookmark', tweet.id)
      }
    }
    catch {
      setBookmarked(prev)
      bumpMetric('bookmarkCount', prev ? 1 : -1)
    }
    setActionLoading(null)
  }, [accountId, tweet.id, bookmarked, actionLoading, onTweetAction, bumpMetric, t])

  return (
    <div
      className={cn(
        'p-4 border-b border-border hover:bg-accent/30 transition-colors',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* 头像 */}
        <Avatar className={cn('shrink-0', compact ? 'h-8 w-8' : 'h-10 w-10')}>
          <AvatarImage src={user?.profileImageUrl} alt={user?.name} />
          <AvatarFallback>{user?.name?.[0] || '?'}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* 用户信息行 */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold truncate">{user?.name || t('twitter.unknown')}</span>
            {user?.verified && (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label={t('twitter.verified')} />
            )}
            <span className="text-muted-foreground truncate">
              @
              {user?.username || t('twitter.unknown')}
            </span>
            {timeAgo && (
              <>
                <span className="text-muted-foreground shrink-0">·</span>
                <span className="text-muted-foreground shrink-0">{timeAgo}</span>
              </>
            )}
          </div>

          {/* 推文文本 */}
          {tweet.text && (
            <p className={cn('mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words', compact && 'line-clamp-3')}>
              {renderTextWithLinks(tweet.text)}
            </p>
          )}

          {/* 媒体网格 */}
          {!compact && tweetMedia.length > 0 && <MediaGrid media={tweetMedia} />}

          {/* 引用推文 */}
          {!compact && quotedTweet && (
            <div className="mt-3 rounded-lg border border-border overflow-hidden">
              <TweetCard
                tweet={quotedTweet.tweet}
                user={quotedTweet.user}
                media={quotedTweet.media}
                compact
              />
            </div>
          )}

          {/* 指标行 / 互动按钮 */}
          {metrics && !compact && (
            <div className="flex items-center gap-5 mt-3">
              {showActions ? (
                <>
                  <ActionButton
                    icon={MessageCircle}
                    count={metrics.replyCount ?? 0}
                    title={t('twitter.reply')}
                  />
                  <ActionButton
                    icon={Repeat2}
                    count={metrics.retweetCount ?? 0}
                    active={retweeted}
                    loading={actionLoading === 'retweet'}
                    onClick={handleRetweet}
                    title={t('twitter.repost')}
                  />
                  <ActionButton
                    icon={Heart}
                    count={metrics.likeCount ?? 0}
                    active={liked}
                    loading={actionLoading === 'like'}
                    onClick={handleLike}
                    title={t('twitter.like')}
                  />
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    {formatNumber(metrics.impressionCount ?? 0)}
                  </span>
                  <ActionButton
                    icon={Bookmark}
                    count={metrics.bookmarkCount ?? 0}
                    active={bookmarked}
                    loading={actionLoading === 'bookmark'}
                    onClick={handleBookmark}
                    title={t('twitter.bookmark')}
                  />
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {formatNumber(metrics.replyCount ?? 0)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Repeat2 className="h-3.5 w-3.5" />
                    {formatNumber(metrics.retweetCount ?? 0)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="h-3.5 w-3.5" />
                    {formatNumber(metrics.likeCount ?? 0)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    {formatNumber(metrics.impressionCount ?? 0)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Bookmark className="h-3.5 w-3.5" />
                    {formatNumber(metrics.bookmarkCount ?? 0)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Quote className="h-3.5 w-3.5" />
                    {formatNumber(metrics.quoteCount ?? 0)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

TweetCard.displayName = 'TweetCard'

export default TweetCard
