/**
 * MyTweetsTab - 我的推文 Tab
 */
import { useEffect, useState } from 'react'
import TweetDetailDialog from '@/components/twitter/TweetDetailDialog'
import { useMyTweets } from '../../hooks/useMyTweets'
import { useTwitterAnalyticsStore } from '../../twitterAnalyticsStore'
import TweetList from '../TimelineTab/TweetList'

export default function MyTweetsTab() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const { myTweets, fetchMyTweets } = useMyTweets()
  const [detailTweetId, setDetailTweetId] = useState<string | null>(null)

  useEffect(() => {
    if (myTweets.tweets.length === 0 && !myTweets.loading) {
      fetchMyTweets(true)
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      <TweetList
        tweets={myTweets.tweets}
        users={myTweets.users}
        media={myTweets.media}
        loading={myTweets.loading}
        hasMore={myTweets.hasMore}
        onLoadMore={() => fetchMyTweets(false)}
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
