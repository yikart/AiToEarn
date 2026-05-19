/**
 * useFollowing - 关注列表数据 hook
 */
import { useCallback } from 'react'
import { apiTwitterUsersFollowing } from '@/api/plat/twitter'
import { useTwitterAnalyticsStore } from '../twitterAnalyticsStore'

export function useFollowing() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const userId = useTwitterAnalyticsStore(s => s.userId)
  const following = useTwitterAnalyticsStore(s => s.following)
  const { setFollowing, appendFollowing } = useTwitterAnalyticsStore()

  const fetchFollowing = useCallback(async (reset = false) => {
    if (!accountId || !userId)
      return
    if (following.loading)
      return
    if (!reset && !following.hasMore)
      return

    setFollowing({ loading: true })

    if (reset) {
      setFollowing({ users: [], meta: undefined, hasMore: true })
    }

    try {
      const paginationToken = reset ? undefined : following.meta?.nextToken

      const res = await apiTwitterUsersFollowing({
        accountId,
        userId,
        paginationToken,
      })

      if (res?.code === 0 && res.data) {
        const { data: users, meta } = res.data
        appendFollowing(
          users ?? [],
          meta,
        )
      }
      else {
        setFollowing({ loading: false })
      }
    }
    catch {
      setFollowing({ loading: false })
    }
  }, [accountId, userId, following.loading, following.hasMore, following.meta?.nextToken])

  return {
    following,
    fetchFollowing,
  }
}
