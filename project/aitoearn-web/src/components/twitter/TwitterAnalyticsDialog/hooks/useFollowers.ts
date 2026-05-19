/**
 * useFollowers - 粉丝列表数据 hook
 */
import { useCallback } from 'react'
import { apiTwitterUsersFollowers } from '@/api/plat/twitter'
import { useTwitterAnalyticsStore } from '../twitterAnalyticsStore'

export function useFollowers() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const userId = useTwitterAnalyticsStore(s => s.userId)
  const followers = useTwitterAnalyticsStore(s => s.followers)
  const { setFollowers, appendFollowers } = useTwitterAnalyticsStore()

  const fetchFollowers = useCallback(async (reset = false) => {
    if (!accountId || !userId)
      return
    if (followers.loading)
      return
    if (!reset && !followers.hasMore)
      return

    setFollowers({ loading: true })

    if (reset) {
      setFollowers({ users: [], meta: undefined, hasMore: true })
    }

    try {
      const paginationToken = reset ? undefined : followers.meta?.nextToken

      const res = await apiTwitterUsersFollowers({
        accountId,
        userId,
        paginationToken,
      })

      if (res?.code === 0 && res.data) {
        const { data: users, meta } = res.data
        appendFollowers(
          users ?? [],
          meta,
        )
      }
      else {
        setFollowers({ loading: false })
      }
    }
    catch {
      setFollowers({ loading: false })
    }
  }, [accountId, userId, followers.loading, followers.hasMore, followers.meta?.nextToken])

  return {
    followers,
    fetchFollowers,
  }
}
