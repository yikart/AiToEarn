/**
 * thumbnailCache - 视频封面缓存 Store
 * 使用 IndexedDB 持久化存储视频封面 URL，避免重复请求
 */

import { getVideoThumbnail } from '@/api/assets'
import { createPersistStore } from '@/utils/createPersistStore'

export interface IThumbnailCacheState {
  cache: Record<string, string>
}

const initialState: IThumbnailCacheState = {
  cache: {},
}

// 并发控制（闭包变量，不进入 store state）
const MAX_CONCURRENT = 3
let activeCount = 0
const pending = new Map<string, Promise<string>>()
const queue: Array<() => void> = []

function runNext() {
  while (activeCount < MAX_CONCURRENT && queue.length > 0) {
    const next = queue.shift()!
    activeCount++
    next()
  }
}

export const useThumbnailCache = createPersistStore(
  { ...initialState },
  (set, get) => ({
    fetchThumbnail(videoUrl: string): Promise<string> {
      // 1. 缓存命中
      const cached = get().cache[videoUrl]
      if (cached)
        return Promise.resolve(cached)

      // 2. 去重：已在请求中
      if (pending.has(videoUrl))
        return pending.get(videoUrl)!

      // 3. 创建请求 Promise
      const promise = new Promise<string>((resolve) => {
        const execute = async () => {
          try {
            const res = await getVideoThumbnail(videoUrl)
            const thumbnailUrl = res?.data?.thumbnailUrl || ''
            if (thumbnailUrl) {
              set(state => ({
                cache: { ...state.cache, [videoUrl]: thumbnailUrl },
              }))
            }
            resolve(thumbnailUrl)
          }
          catch {
            resolve('')
          }
          finally {
            activeCount--
            pending.delete(videoUrl)
            runNext()
          }
        }

        queue.push(execute)
        runNext()
      })

      pending.set(videoUrl, promise)
      return promise
    },
  }),
  { name: 'thumbnail-cache', version: 2 },
  'indexedDB',
)
