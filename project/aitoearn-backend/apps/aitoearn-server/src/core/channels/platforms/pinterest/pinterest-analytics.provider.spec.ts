import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PinterestAnalyticsProvider } from './pinterest-analytics.provider'

describe('pinterest analytics provider', () => {
  it('returns normalized account metrics in public snapshots', async () => {
    const pinterestService = {
      getUser: vi.fn(async () => ({
        platformUid: 'user-1',
        displayName: 'creator',
        username: 'creator',
        avatarUrl: 'https://assets.example.test/avatar.jpg',
        followerCount: 0,
        followingCount: 0,
        monthlyViews: 0,
        pinCount: 0,
      })),
    }
    const provider = new PinterestAnalyticsProvider(pinterestService as never)

    const result = await provider.fetchAccountAnalytics({
      accountId: 'account-1',
      platform: AccountType.Pinterest,
      credential: { accessToken: 'access-token' },
    })

    expect(result.metrics).toEqual({
      fansCount: 0,
      followingCount: 0,
      viewCount: 0,
      workCount: 0,
    })
    expect(result.snapshots[0]?.metrics).toEqual(result.metrics)
    expect(result.extra).toEqual({
      monthlyViews: 0,
      pinCount: 0,
    })
  })

  it('keeps raw work analytics out of public extra', async () => {
    const response = {
      PIN: {
        daily_metrics: [{
          date: '2026-06-01',
          data_status: 'READY',
          metrics: {
            IMPRESSION: 12,
            SAVE: 3,
            CUSTOM_METRIC: 'custom-value',
          },
        }],
      },
    }
    const pinterestService = {
      getPinAnalytics: vi.fn(async () => response),
    }
    const provider = new PinterestAnalyticsProvider(pinterestService as never)

    const result = await provider.fetchWorkAnalytics({
      accountId: 'account-1',
      platform: AccountType.Pinterest,
      platformWorkId: 'pin-1',
      credential: { accessToken: 'access-token' },
      since: new Date('2026-06-01T00:00:00.000Z'),
      until: new Date('2026-06-02T00:00:00.000Z'),
    })

    expect(result.metrics).toEqual({
      impressionCount: 12,
      saveCount: 3,
    })
    expect(result.extra).toEqual({
      dataStatus: 'READY',
      CUSTOM_METRIC: 'custom-value',
    })
    expect(result.extra).not.toHaveProperty('analytics')
    expect(result.snapshots[0]?.extra).not.toHaveProperty('analytics')
    expect(result.rawResponse).toBe(response)
  })
})
