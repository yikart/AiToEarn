/**
 * TweetMetrics - 推文指标详情面板
 * 展示完整 publicMetrics
 */
import type { TwitterTweet } from '@/api/types/twitter'
import { Bookmark, Eye, Heart, MessageCircle, Quote, Repeat2 } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/format'

interface TweetMetricsProps {
  tweet: TwitterTweet
  className?: string
}

const TweetMetrics = memo(({ tweet, className }: TweetMetricsProps) => {
  const { t } = useTransClient('account')
  const metrics = tweet.publicMetrics

  const METRIC_ITEMS = useMemo(() => [
    { key: 'impressionCount', label: t('twitter.impressions'), icon: Eye },
    { key: 'likeCount', label: t('twitter.likes'), icon: Heart },
    { key: 'retweetCount', label: t('twitter.retweets'), icon: Repeat2 },
    { key: 'replyCount', label: t('twitter.replies'), icon: MessageCircle },
    { key: 'bookmarkCount', label: t('twitter.bookmarks'), icon: Bookmark },
    { key: 'quoteCount', label: t('twitter.quotes'), icon: Quote },
  ], [t])

  if (!metrics)
    return null

  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      {METRIC_ITEMS.map(({ key, label, icon: Icon }) => {
        const value = metrics[key as keyof typeof metrics] ?? 0
        return (
          <div key={key} className="flex flex-col items-center p-3 rounded-lg bg-muted/30">
            <Icon className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-lg font-semibold">{formatNumber(value)}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        )
      })}
    </div>
  )
})

TweetMetrics.displayName = 'TweetMetrics'

export default TweetMetrics
