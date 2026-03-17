/**
 * usePluginPublishCache - 插件发布状态持久化缓存
 * 功能：缓存发布成功状态，刷新页面后恢复已发布卡片的状态
 */

import type { IActionCard } from '@/store/agent/agent.types'
import { createPersistStore } from '@/utils/createPersistStore'

export interface PluginPublishRecord {
  state: 'SUCCESS' | 'ERROR'
  shareLink?: string
  errorMsg?: string
  timestamp: number
}

interface PluginPublishCacheState {
  records: Record<string, PluginPublishRecord>
}

/** 简单 hash 函数，将字符串转为短 hash */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // 转为 32 位整数
  }
  return Math.abs(hash).toString(36)
}

/** 从 action 属性生成稳定的缓存 key */
export function getActionKey(action: IActionCard): string {
  const raw = `${action.platform || ''}-${action.accountId || ''}-${action.title || ''}-${action.description || ''}`
  return `pp-${simpleHash(raw)}`
}

const initialState: PluginPublishCacheState = {
  records: {},
}

/** 缓存过期时间：7 天 */
const EXPIRE_MS = 7 * 24 * 60 * 60 * 1000

export const usePluginPublishCache = createPersistStore(
  { ...initialState },
  (set, get) => ({
    getRecord(key: string): PluginPublishRecord | null {
      const record = get().records[key]
      if (!record)
        return null
      // 过期清理
      if (Date.now() - record.timestamp > EXPIRE_MS) {
        const { [key]: _, ...rest } = get().records
        set({ records: rest })
        return null
      }
      return record
    },

    setRecord(key: string, data: PluginPublishRecord) {
      set({
        records: { ...get().records, [key]: data },
      })
    },
  }),
  { name: 'plugin-publish-cache' },
)
