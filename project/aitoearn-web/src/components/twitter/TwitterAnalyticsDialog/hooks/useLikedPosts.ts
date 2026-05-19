/**
 * useLikedPosts - 喜欢的推文数据 hook
 */
import { useCallback } from 'react'
import { apiTwitterUsersLikedPosts } from '@/api/plat/twitter'
import { useTwitterAnalyticsStore } from '../twitterAnalyticsStore'

export function useLikedPosts() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const userId = useTwitterAnalyticsStore(s => s.userId)
  const likedPosts = useTwitterAnalyticsStore(s => s.likedPosts)
  const { setLikedPosts, appendLikedPosts } = useTwitterAnalyticsStore()

  const fetchLikedPosts = useCallback(async (reset = false) => {
    if (!accountId || !userId)
      return
    if (likedPosts.loading)
      return
    if (!reset && !likedPosts.hasMore)
      return

    setLikedPosts({ loading: true })

    if (reset) {
      setLikedPosts({ tweets: [], users: [], media: [], meta: undefined, hasMore: true })
    }

    try {
      const paginationToken = reset ? undefined : likedPosts.meta?.nextToken

      const res = await apiTwitterUsersLikedPosts({
        accountId,
        userId,
        paginationToken,
      })

      if (res?.code === 0 && res.data) {
        const { data: tweets, includes, meta } = res.data
        appendLikedPosts(
          tweets ?? [],
          includes?.users ?? [],
          includes?.media ?? [],
          meta,
        )
      }
      else {
        setLikedPosts({ loading: false })
      }
    }
    catch {
      setLikedPosts({ loading: false })
    }
  }, [accountId, userId, likedPosts.loading, likedPosts.hasMore, likedPosts.meta?.nextToken])

  return {
    likedPosts,
    fetchLikedPosts,
  }
}
