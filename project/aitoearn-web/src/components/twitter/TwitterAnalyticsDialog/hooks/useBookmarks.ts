/**
 * useBookmarks - 书签数据 hook
 */
import { useCallback } from 'react'
import { apiTwitterBookmarks } from '@/api/plat/twitter'
import { useTwitterAnalyticsStore } from '../twitterAnalyticsStore'

export function useBookmarks() {
  const accountId = useTwitterAnalyticsStore(s => s.accountId)
  const bookmarks = useTwitterAnalyticsStore(s => s.bookmarks)
  const { setBookmarks, appendBookmarks } = useTwitterAnalyticsStore()

  const fetchBookmarks = useCallback(async (reset = false) => {
    if (!accountId)
      return
    if (bookmarks.loading)
      return
    if (!reset && !bookmarks.hasMore)
      return

    setBookmarks({ loading: true })

    if (reset) {
      setBookmarks({ tweets: [], users: [], media: [], meta: undefined, hasMore: true })
    }

    try {
      const paginationToken = reset ? undefined : bookmarks.meta?.nextToken

      const res = await apiTwitterBookmarks({
        accountId,
        paginationToken,
      })

      if (res?.code === 0 && res.data) {
        const { data: tweets, includes, meta } = res.data
        appendBookmarks(
          tweets ?? [],
          includes?.users ?? [],
          includes?.media ?? [],
          meta,
        )
      }
      else {
        setBookmarks({ loading: false })
      }
    }
    catch {
      setBookmarks({ loading: false })
    }
  }, [accountId, bookmarks.loading, bookmarks.hasMore, bookmarks.meta?.nextToken])

  return {
    bookmarks,
    fetchBookmarks,
  }
}
