/**
 * fansRefreshCooldownStore - 频道粉丝数刷新冷却记录
 * 按平台记录最近一次刷新时间，避免一小时内重复触发。
 */

import type { PlatType } from '@/app/config/platConfig'
import { createPersistStore } from '@/utils/storage/createPersistStore'

interface FansRefreshCooldownState {
  platformRecords: Partial<Record<PlatType, number>>
}

const FANS_REFRESH_COOLDOWN = 60 * 60 * 1000

function calcPlatformRefreshRemaining(
  records: Partial<Record<PlatType, number>>,
  platform: PlatType,
) {
  const lastRefreshTime = records[platform] || 0
  return Math.max(0, FANS_REFRESH_COOLDOWN - (Date.now() - lastRefreshTime))
}

export const useFansRefreshCooldownStore = createPersistStore<
  FansRefreshCooldownState,
  {
    markPlatformRefresh: (platform: PlatType) => void
    canPlatformRefresh: (platform: PlatType) => boolean
    getPlatformRefreshRemaining: (platform: PlatType) => number
  }
>(
  { platformRecords: {} },
  (set, get) => ({
    markPlatformRefresh(platform) {
      const state = get()
      set({
        platformRecords: {
          ...state.platformRecords,
          [platform]: Date.now(),
        },
      })
    },

    canPlatformRefresh(platform) {
      return calcPlatformRefreshRemaining(get().platformRecords, platform) <= 0
    },

    getPlatformRefreshRemaining(platform) {
      return calcPlatformRefreshRemaining(get().platformRecords, platform)
    },
  }),
  { name: 'aitoearn-channel-fans-refresh-cooldown', version: 1 },
)
