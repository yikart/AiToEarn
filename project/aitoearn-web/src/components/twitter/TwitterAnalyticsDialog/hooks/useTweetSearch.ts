/**
 * useTweetSearch - 搜索数据 hook
 */
import { useCallback } from 'react'
import { apiTwitterSearchTweets, apiTwitterUserByUsername, apiTwitterUserPostsForUser } from '@/api/plat/twitter'
import { useTwitterAnalyticsStore } from '../twitterAnalyticsStore'

export function useTweetSearch() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const searchQuery = useTwitterAnalyticsStore(s => s.searchQuery)
  const searchResults = useTwitterAnalyticsStore(s => s.searchResults)
  const searchUser = useTwitterAnalyticsStore(s => s.searchUser)
  const { setSearchQuery, setSearchResults, appendSearchResults, setSearchUser } = useTwitterAnalyticsStore()

  const searchTweets = useCallback(async (query: string, reset = false) => {
    if (!accountId || !query.trim())
      return
    if (searchResults.loading)
      return
    if (!reset && !searchResults.hasMore)
      return

    setSearchQuery(query)
    setSearchResults({ loading: true })

    if (reset) {
      setSearchResults({ tweets: [], users: [], media: [], meta: undefined, hasMore: true })
    }

    try {
      const paginationToken = reset ? undefined : searchResults.meta?.nextToken

      const res = await apiTwitterSearchTweets({
        accountId,
        query: query.trim(),
        paginationToken,
      })

      if (res?.code === 0 && res.data) {
        const { data: tweets, includes, meta } = res.data
        appendSearchResults(
          tweets ?? [],
          includes?.users ?? [],
          includes?.media ?? [],
          meta,
        )
      }
      else {
        setSearchResults({ loading: false })
      }
    }
    catch {
      setSearchResults({ loading: false })
    }
  }, [accountId, searchResults.loading, searchResults.hasMore, searchResults.meta?.nextToken])

  const lookupUser = useCallback(async (username: string) => {
    if (!accountId || !username.trim())
      return

    try {
      const res = await apiTwitterUserByUsername({ accountId, username: username.trim() })
      if (res?.code === 0 && res.data) {
        setSearchUser(res.data.data)
      }
    }
    catch {
      // ignore
    }
  }, [accountId])

  const fetchUserPosts = useCallback(async (userId: string, reset = false) => {
    if (!accountId || !userId)
      return
    if (searchResults.loading)
      return
    if (!reset && !searchResults.hasMore)
      return

    setSearchResults({ loading: true })

    if (reset) {
      setSearchResults({ tweets: [], users: [], media: [], meta: undefined, hasMore: true })
    }

    try {
      const paginationToken = reset ? undefined : searchResults.meta?.nextToken

      const res = await apiTwitterUserPostsForUser({
        accountId,
        userId,
        paginationToken,
      })

      if (res?.code === 0 && res.data) {
        const { data: tweets, includes, meta } = res.data
        appendSearchResults(
          tweets ?? [],
          includes?.users ?? [],
          includes?.media ?? [],
          meta,
        )
      }
      else {
        setSearchResults({ loading: false })
      }
    }
    catch {
      setSearchResults({ loading: false })
    }
  }, [accountId, searchResults.loading, searchResults.hasMore, searchResults.meta?.nextToken])

  return {
    searchQuery,
    searchResults,
    searchUser,
    searchTweets,
    lookupUser,
    fetchUserPosts,
    setSearchUser,
  }
}
