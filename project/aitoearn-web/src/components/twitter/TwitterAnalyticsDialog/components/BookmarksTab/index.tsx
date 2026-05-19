/**
 * BookmarksTab - 书签 Tab
 */
import { useCallback, useEffect, useState } from 'react'
import TweetDetailDialog from '@/components/twitter/TweetDetailDialog'
import { useBookmarks } from '../../hooks/useBookmarks'
import { useTwitterAnalyticsStore } from '../../twitterAnalyticsStore'
import TweetList from '../TimelineTab/TweetList'

export default function BookmarksTab() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const { bookmarks, fetchBookmarks } = useBookmarks()
  const setBookmarks = useTwitterAnalyticsStore(s => s.setBookmarks)
  const [detailTweetId, setDetailTweetId] = useState<string | null>(null)

  useEffect(() => {
    if (bookmarks.tweets.length === 0 && !bookmarks.loading) {
      fetchBookmarks(true)
    }
  }, [])

  const handleTweetAction = useCallback((action: string, tweetId: string) => {
    if (action === 'bookmark') {
      // 取消书签 → 从列表中移除
      setBookmarks({
        tweets: bookmarks.tweets.filter(t => t.id !== tweetId),
      })
    }
  }, [bookmarks.tweets, setBookmarks])

  return (
    <div className="flex flex-col h-full">
      <TweetList
        tweets={bookmarks.tweets}
        users={bookmarks.users}
        media={bookmarks.media}
        loading={bookmarks.loading}
        hasMore={bookmarks.hasMore}
        onLoadMore={() => fetchBookmarks(false)}
        accountId={accountId}
        onTweetClick={setDetailTweetId}
        onTweetAction={handleTweetAction}
        initialBookmarked
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
