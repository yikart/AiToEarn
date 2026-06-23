/**
 * workAnalyticsCacheStore - Accounts page channel work analytics cache.
 * Caches analytics responses for 3 hours and keeps backend fetchedAt as the data update time.
 */

import type { ChannelWorkAnalyticsVo } from '@/api/channels/channel.types'
import type { PlatType } from '@/app/config/platConfig'
import { getChannelWorkAnalyticsApi } from '@/api/channels/channel.api'
import { createPersistStore } from '@/utils/storage/createPersistStore'

const WORK_ANALYTICS_CACHE_TTL_MS = 3 * 60 * 60 * 1000

interface WorkAnalyticsCacheRecord {
  data: ChannelWorkAnalyticsVo
  cachedAt: number
}

interface WorkAnalyticsCacheState {
  cache: Record<string, WorkAnalyticsCacheRecord>
}

const initialState: WorkAnalyticsCacheState = {
  cache: {},
}

const pendingRequests = new Map<string, Promise<ChannelWorkAnalyticsVo | null>>()

function createWorkAnalyticsCacheKey(platform: PlatType, platformWorkId: string, accountId: string) {
  return [platform, accountId, platformWorkId].map(encodeURIComponent).join(':')
}

function isCacheFresh(record?: WorkAnalyticsCacheRecord) {
  return !!record && Date.now() - record.cachedAt < WORK_ANALYTICS_CACHE_TTL_MS
}

export const useAccountsWorkAnalyticsCacheStore = createPersistStore(
  { ...initialState },
  (set, get) => {
    const methods = {
      getAnalytics(platform: PlatType, platformWorkId: string, accountId: string) {
        const key = createWorkAnalyticsCacheKey(platform, platformWorkId, accountId)
        return methods.getAnalyticsByKey(key)
      },

      getAnalyticsByKey(key: string) {
        const record = get().cache[key]
        if (!record)
          return null

        if (!isCacheFresh(record)) {
          methods.clearAnalyticsByKey(key)
          return null
        }

        return record.data
      },

      setAnalyticsByKey(key: string, data: ChannelWorkAnalyticsVo) {
        set(state => ({
          cache: {
            ...state.cache,
            [key]: {
              data,
              cachedAt: Date.now(),
            },
          },
        }))
      },

      clearAnalyticsByKey(key: string) {
        set((state) => {
          const cache = { ...state.cache }
          delete cache[key]
          return { cache }
        })
      },

      clearExpiredAnalytics() {
        const now = Date.now()
        set((state) => {
          const cache = Object.fromEntries(
            Object.entries(state.cache).filter(([, record]) => now - record.cachedAt < WORK_ANALYTICS_CACHE_TTL_MS),
          )
          return { cache }
        })
      },

      async fetchAnalytics(platform: PlatType, platformWorkId: string, accountId: string) {
        const key = createWorkAnalyticsCacheKey(platform, platformWorkId, accountId)
        const cached = methods.getAnalyticsByKey(key)
        if (cached)
          return cached

        const pending = pendingRequests.get(key)
        if (pending)
          return pending

        const request = (async () => {
          try {
            const res = await getChannelWorkAnalyticsApi(platform, platformWorkId, { accountId })
            if (!res || res.code !== 0 || !res.data)
              return null

            methods.setAnalyticsByKey(key, res.data)
            methods.clearExpiredAnalytics()
            return res.data
          }
          catch {
            return null
          }
          finally {
            pendingRequests.delete(key)
          }
        })()

        pendingRequests.set(key, request)
        return request
      },
    }

    return methods
  },
  {
    name: 'accounts-work-analytics-cache',
    version: 1,
  },
  'localStorage',
)
