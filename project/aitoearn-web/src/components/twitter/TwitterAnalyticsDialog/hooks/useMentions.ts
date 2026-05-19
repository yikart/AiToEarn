/**
 * useMentions - 提及数据 hook
 */
import { useCallback } from 'react'
import { apiTwitterUserMentions } from '@/api/plat/twitter'
import { useTwitterAnalyticsStore } from '../twitterAnalyticsStore'

export function useMentions() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const mentions = useTwitterAnalyticsStore(s => s.mentions)
  const { setMentions, appendMentions } = useTwitterAnalyticsStore()

  const fetchMentions = useCallback(async (reset = false) => {
    if (!accountId)
      return
    if (mentions.loading)
      return
    if (!reset && !mentions.hasMore)
      return

    setMentions({ loading: true })

    if (reset) {
      setMentions({ tweets: [], users: [], media: [], meta: undefined, hasMore: true })
    }

    try {
      const paginationToken = reset ? undefined : mentions.meta?.nextToken

      const res = await apiTwitterUserMentions({
        accountId,
        paginationToken,
      })

      if (res?.code === 0 && res.data) {
        const { data: tweets, includes, meta } = res.data
        appendMentions(
          tweets ?? [],
          includes?.users ?? [],
          includes?.media ?? [],
          meta,
        )
      }
      else {
        setMentions({ loading: false })
      }
    }
    catch {
      setMentions({ loading: false })
    }
  }, [accountId, mentions.loading, mentions.hasMore, mentions.meta?.nextToken])

  return {
    mentions,
    fetchMentions,
  }
}
