/**
 * SearchResults - 搜索结果列表
 */
import type { TwitterMediaItem, TwitterTweet, TwitterUser } from '@/api/types/twitter'
import TweetList from '../TimelineTab/TweetList'

interface SearchResultsProps {
  tweets: TwitterTweet[]
  users: TwitterUser[]
  media: TwitterMediaItem[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  accountId?: string
  onTweetClick?: (tweetId: string) => void
}

export default function SearchResults({ tweets, users, media, loading, hasMore, onLoadMore, accountId, onTweetClick }: SearchResultsProps) {
  return (
    <TweetList
      tweets={tweets}
      users={users}
      media={media}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      accountId={accountId}
      onTweetClick={onTweetClick}
    />
  )
}
