/**
 * MentionsTab - 提及 Tab
 */
import { useEffect, useState } from 'react'
import TweetDetailDialog from '@/components/twitter/TweetDetailDialog'
import { useMentions } from '../../hooks/useMentions'
import { useTwitterAnalyticsStore } from '../../twitterAnalyticsStore'
import TweetList from '../TimelineTab/TweetList'

export default function MentionsTab() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const { mentions, fetchMentions } = useMentions()
  const [detailTweetId, setDetailTweetId] = useState<string | null>(null)

  useEffect(() => {
    if (mentions.tweets.length === 0 && !mentions.loading) {
      fetchMentions(true)
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      <TweetList
        tweets={mentions.tweets}
        users={mentions.users}
        media={mentions.media}
        loading={mentions.loading}
        hasMore={mentions.hasMore}
        onLoadMore={() => fetchMentions(false)}
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
