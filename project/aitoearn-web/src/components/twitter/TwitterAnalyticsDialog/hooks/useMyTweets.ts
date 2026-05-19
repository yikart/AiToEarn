/**
 * useMyTweets - 我的推文数据 hook
 */
import { useCallback } from 'react'
import { apiTwitterUserPostsForUser } from '@/api/plat/twitter'
import { useTwitterAnalyticsStore } from '../twitterAnalyticsStore'

export function useMyTweets() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const userId = useTwitterAnalyticsStore(s => s.userId)
  const myTweets = useTwitterAnalyticsStore(s => s.myTweets)
  const { setMyTweets, appendMyTweets } = useTwitterAnalyticsStore()

  const fetchMyTweets = useCallback(async (reset = false) => {
    if (!accountId || !userId)
      return
    if (myTweets.loading)
      return
    if (!reset && !myTweets.hasMore)
      return

    setMyTweets({ loading: true })

    if (reset) {
      setMyTweets({ tweets: [], users: [], media: [], meta: undefined, hasMore: true })
    }

    try {
      const paginationToken = reset ? undefined : myTweets.meta?.nextToken

      const res = await apiTwitterUserPostsForUser({
        accountId,
        userId,
        paginationToken,
      })

      if (res?.code === 0 && res.data) {
        const { data: tweets, includes, meta } = res.data
        appendMyTweets(
          tweets ?? [],
          includes?.users ?? [],
          includes?.media ?? [],
          meta,
        )
      }
      else {
        setMyTweets({ loading: false })
      }
    }
    catch {
      setMyTweets({ loading: false })
    }
  }, [accountId, userId, myTweets.loading, myTweets.hasMore, myTweets.meta?.nextToken])

  return {
    myTweets,
    fetchMyTweets,
  }
}
