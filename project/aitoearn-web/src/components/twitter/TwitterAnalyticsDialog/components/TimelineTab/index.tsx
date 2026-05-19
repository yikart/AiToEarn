/**
 * TimelineTab - 时间线 Tab
 */
import { useCallback, useEffect, useState } from 'react'
import TweetDetailDialog from '@/components/twitter/TweetDetailDialog'
import { useTimeline } from '../../hooks/useTimeline'
import { useTwitterAnalyticsStore } from '../../twitterAnalyticsStore'
import TimelineFilters from './TimelineFilters'
import TweetList from './TweetList'

export default function TimelineTab() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const { timeline, excludeRetweets, excludeReplies, fetchTimeline, setTimelineFilters } = useTimeline()
  const [detailTweetId, setDetailTweetId] = useState<string | null>(null)

  useEffect(() => {
    if (timeline.tweets.length === 0 && !timeline.loading) {
      fetchTimeline(true)
    }
  }, [])

  const handleFilterChange = useCallback((key: 'retweets' | 'replies', value: boolean) => {
    if (key === 'retweets')
      setTimelineFilters(value, undefined)
    if (key === 'replies')
      setTimelineFilters(undefined, value)
    // Reset and refetch with new filters
    setTimeout(() => fetchTimeline(true), 0)
  }, [setTimelineFilters, fetchTimeline])

  return (
    <div className="flex flex-col h-full">
      <TimelineFilters
        excludeRetweets={excludeRetweets}
        excludeReplies={excludeReplies}
        onChange={handleFilterChange}
      />
      <TweetList
        tweets={timeline.tweets}
        users={timeline.users}
        media={timeline.media}
        loading={timeline.loading}
        hasMore={timeline.hasMore}
        onLoadMore={() => fetchTimeline(false)}
        accountId={accountId}
        onTweetClick={setDetailTweetId}
      />

      {detailTweetId && (
        <TweetDetailDialog
          open
          onOpenChange={(open) => {
            if (!open)
              setDetailTweetId(null)
          }}
          accountId={accountId}
          tweetId={detailTweetId}
        />
      )}
    </div>
  )
}
