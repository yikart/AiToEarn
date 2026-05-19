/**
 * useTimeline - 时间线数据 hook（使用 API 接口，非爬虫）
 */
import type { TwitterTimelineExclude } from '@/api/types/twitter'
import { useCallback } from 'react'
import { apiTwitterHomeTimeline } from '@/api/plat/twitter'
import { useTwitterAnalyticsStore } from '../twitterAnalyticsStore'

export function useTimeline() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const timeline = useTwitterAnalyticsStore(s => s.timeline)
  const excludeRetweets = useTwitterAnalyticsStore(s => s.timelineExcludeRetweets)
  const excludeReplies = useTwitterAnalyticsStore(s => s.timelineExcludeReplies)
  const { setTimeline, appendTimeline, setTimelineFilters } = useTwitterAnalyticsStore()

  const fetchTimeline = useCallback(async (reset = false) => {
    if (!accountId)
      return
    if (timeline.loading)
      return
    if (!reset && !timeline.hasMore)
      return

    setTimeline({ loading: true })

    if (reset) {
      setTimeline({ tweets: [], users: [], media: [], meta: undefined, hasMore: true })
    }

    try {
      const exclude: TwitterTimelineExclude[] = []
      if (excludeRetweets)
        exclude.push('retweets')
      if (excludeReplies)
        exclude.push('replies')

      const paginationToken = reset ? undefined : timeline.meta?.nextToken

      const res = await apiTwitterHomeTimeline({
        accountId,
        exclude: exclude.length ? exclude : undefined,
        paginationToken,
      })

      if (res?.code === 0 && res.data) {
        const { data: tweets, includes, meta } = res.data
        appendTimeline(
          tweets ?? [],
          includes?.users ?? [],
          includes?.media ?? [],
          meta,
        )
      }
      else {
        setTimeline({ loading: false })
      }
    }
    catch {
      setTimeline({ loading: false })
    }
  }, [accountId, timeline.loading, timeline.hasMore, timeline.meta?.nextToken, excludeRetweets, excludeReplies])

  return {
    timeline,
    excludeRetweets,
    excludeReplies,
    fetchTimeline,
    setTimelineFilters,
  }
}
