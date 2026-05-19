/**
 * TweetList - 推文列表 + 无限滚动
 */
import type { TwitterMediaItem, TwitterTweet, TwitterUser } from '@/api/types/twitter'
import { Loader2 } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import TweetCard, { findTweetMedia, findTweetUser } from '@/components/twitter/TweetCard'
import TweetCardSkeleton from '@/components/twitter/TweetCardSkeleton'

interface TweetListProps {
  tweets: TwitterTweet[]
  users: TwitterUser[]
  media: TwitterMediaItem[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  /** 账号 ID，提供后启用互动按钮 */
  accountId?: string
  /** 点击推文回调 */
  onTweetClick?: (tweetId: string) => void
  /** 互动操作回调 */
  onTweetAction?: (action: string, tweetId: string) => void
  /** 初始收藏状态（书签 Tab 使用） */
  initialBookmarked?: boolean
  /** 初始点赞状态（喜欢 Tab 使用） */
  initialLiked?: boolean
}

export default function TweetList({ tweets, users, media, loading, hasMore, onLoadMore, accountId, onTweetClick, onTweetAction, initialBookmarked, initialLiked }: TweetListProps) {
  const { t } = useTransClient('account')
  const observerRef = useRef<IntersectionObserver | null>(null)

  const lastTweetRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading)
        return
      if (observerRef.current)
        observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore()
        }
      })

      if (node)
        observerRef.current.observe(node)
    },
    [loading, hasMore, onLoadMore],
  )

  if (tweets.length === 0 && loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <TweetCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (tweets.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-12">
        {t('twitter.noTweets')}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {tweets.map((tweet, i) => {
        const isLast = i === tweets.length - 1
        const user = findTweetUser(tweet, users)
        const tweetMedia = findTweetMedia(tweet, media)

        const quotedRef = tweet.referencedTweets?.find(r => r.type === 'quoted')
        const quotedTweet = quotedRef
          ? tweets.find(t => t.id === quotedRef.id) || undefined
          : undefined
        const quotedUser = quotedTweet ? findTweetUser(quotedTweet, users) : undefined
        const quotedMedia = quotedTweet ? findTweetMedia(quotedTweet, media) : undefined

        return (
          <div key={tweet.id} ref={isLast ? lastTweetRef : undefined}>
            <TweetCard
              tweet={tweet}
              user={user}
              media={tweetMedia}
              quotedTweet={quotedTweet ? { tweet: quotedTweet, user: quotedUser, media: quotedMedia } : undefined}
              accountId={accountId}
              onClick={onTweetClick ? () => onTweetClick(tweet.id) : undefined}
              onTweetAction={onTweetAction}
              initialBookmarked={initialBookmarked}
              initialLiked={initialLiked}
            />
          </div>
        )
      })}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
