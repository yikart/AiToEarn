import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory } from '../platforms.exception'
import { InstagramAnalyticsProvider } from './instagram-analytics.provider'

describe('instagram analytics provider', () => {
  it('rejects account insights when the stored token scope lacks insights permission', async () => {
    const instagramService = {
      getAccountInsights: vi.fn(),
    }
    const provider = new InstagramAnalyticsProvider(instagramService as never)

    await expect(provider.fetchAccountAnalytics({
      accountId: 'account-1',
      platform: AccountType.Instagram,
      credential: {
        accessToken: 'access-token',
        platformUid: 'ig-user-1',
        scope: 'instagram_business_basic,instagram_business_content_publish',
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformPermissionMissing,
      category: PlatformErrorCategory.Permission,
    })
    expect(instagramService.getAccountInsights).not.toHaveBeenCalled()
  })

  it('passes through account insights when the stored token scope includes insights permission', async () => {
    const response = {
      data: [{
        name: 'reach',
        values: [{
          value: 10,
          end_time: '2026-06-01T00:00:00+0000',
        }],
      }],
    }
    const instagramService = {
      getAccountInsights: vi.fn(async () => response),
    }
    const provider = new InstagramAnalyticsProvider(instagramService as never)

    const result = await provider.fetchAccountAnalytics({
      accountId: 'account-1',
      platform: AccountType.Instagram,
      credential: {
        accessToken: 'access-token',
        platformUid: 'ig-user-1',
        scope: 'instagram_business_basic,instagram_business_manage_insights',
      },
    })

    expect(instagramService.getAccountInsights).toHaveBeenCalledWith(
      'access-token',
      'ig-user-1',
      { since: undefined, until: undefined },
    )
    expect(result.metrics).toEqual({ reachCount: 10 })
  })
})
