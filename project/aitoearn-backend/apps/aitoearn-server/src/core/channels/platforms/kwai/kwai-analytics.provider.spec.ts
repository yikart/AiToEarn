import type { KwaiService } from './kwai.service'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { KwaiAnalyticsProvider } from './kwai-analytics.provider'

function createProvider() {
  const kwaiService = {
    getUserInfo: vi.fn(async () => ({
      displayName: 'Kwai User',
      avatarUrl: 'https://cdn.example.test/avatar.jpg',
      fanCount: 12,
      followCount: 3,
      city: 'Hangzhou',
      sex: 'F',
    })),
    getVideoInfo: vi.fn(async () => ({
      photoId: 'photo-1',
      caption: 'caption',
      cover: 'https://cdn.example.test/cover.jpg',
      playUrl: 'https://v.kuaishou.com/photo-1',
      createTime: 1717200000,
      likeCount: 8,
      commentCount: 2,
      viewCount: 100,
      pending: false,
    })),
  } as unknown as KwaiService

  return {
    provider: new KwaiAnalyticsProvider(kwaiService),
    kwaiService: kwaiService as unknown as {
      getUserInfo: ReturnType<typeof vi.fn>
      getVideoInfo: ReturnType<typeof vi.fn>
    },
  }
}

describe('kwai analytics provider', () => {
  it('uses user_info fan and follow for account analytics', async () => {
    const { provider, kwaiService } = createProvider()

    const result = await provider.fetchAccountAnalytics({
      accountId: 'account-1',
      platform: AccountType.Kwai,
      credential: {
        accessToken: 'access-token',
        platformUid: 'open-id',
      },
    })

    expect(kwaiService.getUserInfo).toHaveBeenCalledWith('access-token')
    expect(result.profile).toEqual({
      displayName: 'Kwai User',
      avatarUrl: 'https://cdn.example.test/avatar.jpg',
    })
    expect(result.metrics).toEqual({
      fansCount: 12,
      followingCount: 3,
    })
    expect(result.extra).toEqual({
      city: 'Hangzhou',
      sex: 'F',
    })
    expect(result.snapshots[0]).toMatchObject({
      platformUid: 'open-id',
      profile: result.profile,
      metrics: result.metrics,
      extra: result.extra,
    })
  })

  it('uses photo info metrics for work analytics', async () => {
    const { provider, kwaiService } = createProvider()

    const result = await provider.fetchWorkAnalytics({
      accountId: 'account-1',
      platform: AccountType.Kwai,
      platformWorkId: 'photo-1',
      credential: {
        accessToken: 'access-token',
      },
    })

    expect(kwaiService.getVideoInfo).toHaveBeenCalledWith('access-token', 'photo-1')
    expect(result.work).toEqual({
      id: 'photo-1',
      title: 'caption',
      description: 'caption',
      url: 'https://www.kuaishou.com/short-video/photo-1',
      mediaType: 'video',
      coverUrl: 'https://cdn.example.test/cover.jpg',
      publishedAt: new Date(1717200000 * 1000),
      status: 'published',
    })
    expect(result.metrics).toEqual({
      viewCount: 100,
      likeCount: 8,
      commentCount: 2,
    })
    expect(result.extra).toEqual({
      pending: false,
    })
  })
})
