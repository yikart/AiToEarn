/**
 * publishDetailCache - 发布详情缓存 Store
 * 使用 IndexedDB 持久化存储发布记录详情，避免重复 API 调用
 */

import type { PublishRecordItem } from '@/api/plat/types/publish.types'
import { getPublishRecordDetail } from '@/api/plat/publish'
import { createPersistStore } from '@/utils/createPersistStore'

// 缓存过期时间：5 分钟
const CACHE_EXPIRY_MS = 5 * 60 * 1000

export interface IPublishDetailCacheState {
  // flowId -> PublishRecordItem 的映射
  cache: Record<string, PublishRecordItem>
  // flowId -> 最后更新时间戳
  timestamps: Record<string, number>
}

const initialState: IPublishDetailCacheState = {
  cache: {},
  timestamps: {},
}

export const usePublishDetailCache = createPersistStore(
  { ...initialState },
  (set, get) => {
    const methods = {
      /**
       * 获取缓存的详情
       */
      getDetail(flowId: string): PublishRecordItem | null {
        const { cache } = get()
        return cache[flowId] || null
      },

      /**
       * 设置缓存
       */
      setDetail(flowId: string, data: PublishRecordItem): void {
        set(state => ({
          cache: { ...state.cache, [flowId]: data },
          timestamps: { ...state.timestamps, [flowId]: Date.now() },
        }))
      },

      /**
       * 检查缓存是否过期
       */
      isExpired(flowId: string): boolean {
        const { timestamps } = get()
        const lastUpdate = timestamps[flowId]
        if (!lastUpdate)
          return true
        return Date.now() - lastUpdate > CACHE_EXPIRY_MS
      },

      /**
       * 获取并缓存详情
       * 如果缓存有效则返回缓存，否则调用 API 获取
       * @param forceRefresh 是否强制刷新（跳过缓存）
       */
      async fetchAndCache(flowId: string, forceRefresh = false): Promise<PublishRecordItem | null> {
        const { cache, timestamps } = get()

        // 检查缓存是否有效
        if (!forceRefresh && cache[flowId]) {
          const lastUpdate = timestamps[flowId]
          if (lastUpdate && Date.now() - lastUpdate < CACHE_EXPIRY_MS) {
            return cache[flowId]
          }
        }

        // 调用 API 获取
        try {
          const response = await getPublishRecordDetail(flowId)
          if (response && response.data) {
            methods.setDetail(flowId, response.data)
            return response.data
          }
          return null
        }
        catch (error) {
          console.error('Failed to fetch publish detail:', error)
          return null
        }
      },

      /**
       * 清除指定 flowId 的缓存
       */
      clearCache(flowId: string): void {
        set((state) => {
          const newCache = { ...state.cache }
          const newTimestamps = { ...state.timestamps }
          delete newCache[flowId]
          delete newTimestamps[flowId]
          return { cache: newCache, timestamps: newTimestamps }
        })
      },

      /**
       * 清除所有缓存
       */
      clearAllCache(): void {
        set({ cache: {}, timestamps: {} })
      },
    }

    return methods
  },
  {
    name: 'publish-detail-cache',
  },
  'indexedDB',
)
