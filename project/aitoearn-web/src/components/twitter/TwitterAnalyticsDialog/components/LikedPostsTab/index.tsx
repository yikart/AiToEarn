/**
 * LikedPostsTab - 喜欢的推文 Tab
 */
import { useEffect, useState } from 'react'
import TweetDetailDialog from '@/components/twitter/TweetDetailDialog'
import { useLikedPosts } from '../../hooks/useLikedPosts'
import { useTwitterAnalyticsStore } from '../../twitterAnalyticsStore'
import TweetList from '../TimelineTab/TweetList'

export default function LikedPostsTab() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const { likedPosts, fetchLikedPosts } = useLikedPosts()
  const [detailTweetId, setDetailTweetId] = useState<string | null>(null)

  useEffect(() => {
    if (likedPosts.tweets.length === 0 && !likedPosts.loading) {
      fetchLikedPosts(true)
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      <TweetList
        tweets={likedPosts.tweets}
        users={likedPosts.users}
        media={likedPosts.media}
        loading={likedPosts.loading}
        hasMore={likedPosts.hasMore}
        onLoadMore={() => fetchLikedPosts(false)}
        accountId={accountId}
        onTweetClick={setDetailTweetId}
        initialLiked
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
