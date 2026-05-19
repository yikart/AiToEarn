/**
 * SearchTab - 搜索 Tab
 */
import { useState } from 'react'
import TweetDetailDialog from '@/components/twitter/TweetDetailDialog'
import { useTweetSearch } from '../../hooks/useTweetSearch'
import { useTwitterAnalyticsStore } from '../../twitterAnalyticsStore'
import SearchInput from './SearchInput'
import SearchResults from './SearchResults'
import UserProfileCard from './UserProfileCard'

export default function SearchTab() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const { searchQuery, searchResults, searchUser, searchTweets, lookupUser, fetchUserPosts, setSearchUser } = useTweetSearch()
  const [detailTweetId, setDetailTweetId] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full">
      <SearchInput
        defaultValue={searchQuery}
        onSearch={q => searchTweets(q, true)}
        onUserLookup={lookupUser}
      />

      {searchUser && (
        <UserProfileCard
          user={searchUser}
          onViewPosts={() => {
            fetchUserPosts(searchUser.id, true)
          }}
          onClear={() => setSearchUser(null)}
        />
      )}

      <SearchResults
        tweets={searchResults.tweets}
        users={searchResults.users}
        media={searchResults.media}
        loading={searchResults.loading}
        hasMore={searchResults.hasMore}
        onLoadMore={() => searchTweets(searchQuery)}
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
