import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'

import { FacebookAnalyticsProvider } from './facebook-analytics.provider'

vi.mock('./facebook.service', () => ({
  FacebookService: class FacebookService {},
}))

describe('facebook analytics provider', () => {
  it('uses page summary fields for account analytics', async () => {
    const facebookService = {
      getPageInfo: vi.fn(async () => ({
        id: 'page-1',
        name: 'Page One',
        fan_count: 12,
        followers_count: 34,
        picture: { data: { url: 'https://assets.example.test/page.jpg' } },
        category: 'Creator',
        category_list: [{ id: 'category-1', name: 'Creator' }],
      })),
      getPageInsights: vi.fn(),
    }
    const provider = new FacebookAnalyticsProvider(facebookService as never)

    const result = await provider.fetchAccountAnalytics({
      accountId: 'account-1',
      platform: AccountType.Facebook,
      credential: {
        accessToken: 'page-token',
        platformUid: 'page-1',
      },
    })

    expect(facebookService.getPageInfo).toHaveBeenCalledWith('page-token', 'page-1')
    expect(facebookService.getPageInsights).not.toHaveBeenCalled()
    expect(result.profile).toEqual({
      displayName: 'Page One',
      avatarUrl: 'https://assets.example.test/page.jpg',
    })
    expect(result.metrics).toEqual({ fansCount: 34 })
    expect(result.extra).toEqual({
      fanCount: 12,
      followersCount: 34,
      category: 'Creator',
      categoryList: [{ id: 'category-1', name: 'Creator' }],
    })
    expect(result.snapshots[0]).toMatchObject({
      platformUid: 'page-1',
      profile: result.profile,
      metrics: result.metrics,
      extra: result.extra,
    })
  })
})
