import { describe, expect, it, vi } from 'vitest'
import { BilibiliAnalyticsProvider } from './bilibili-analytics.provider'

vi.mock('@yikart/assets', () => ({
  AssetsService: class AssetsService {},
  VideoMetadataService: class VideoMetadataService {},
}))

vi.mock('@yikart/mongodb', () => ({
  AssetType: {
    PublishMedia: 'publishMedia',
  },
}))

function createProvider() {
  const bilibiliService = {
    getUserStat: vi.fn(async () => ({
      fansCount: 1200,
      followingCount: 8,
      archiveCount: 33,
    })),
    getArchiveStat: vi.fn(async () => ({
      title: 'Video title',
      ptime: 1_700_000_000,
      view: 100,
      like: 9,
      favorite: 4,
      share: 3,
      reply: 2,
      coin: 7,
      danmaku: 6,
    })),
  }
  const provider = new BilibiliAnalyticsProvider(bilibiliService as never)

  return { provider, bilibiliService }
}

describe('bilibili analytics provider', () => {
  it('fetches official user and archive data APIs', async () => {
    const { provider, bilibiliService } = createProvider()

    const accountResult = await provider.fetchAccountAnalytics({
      accountId: 'account-1',
      platform: 'bilibili' as never,
      credential: { accessToken: 'access-token' },
    })

    expect(accountResult).toMatchObject({
      metrics: {
        fansCount: 1200,
        followingCount: 8,
        workCount: 33,
      },
      extra: {
        archiveCount: 33,
      },
      rawResponse: {
        fansCount: 1200,
        followingCount: 8,
        archiveCount: 33,
      },
    })
    expect(accountResult.snapshots).toHaveLength(1)
    expect(accountResult.snapshots[0]).toMatchObject({
      metrics: {
        fansCount: 1200,
        followingCount: 8,
        workCount: 33,
      },
      extra: {
        archiveCount: 33,
      },
    })

    const workResult = await provider.fetchWorkAnalytics({
      accountId: 'account-1',
      platformWorkId: 'BV1xx411c7mD',
      platform: 'bilibili' as never,
      credential: { accessToken: 'access-token' },
    })

    expect(workResult).toMatchObject({
      work: {
        id: 'BV1xx411c7mD',
        title: 'Video title',
        publishedAt: new Date(1_700_000_000 * 1000),
      },
      metrics: {
        viewCount: 100,
        likeCount: 9,
        collectCount: 4,
        shareCount: 3,
        commentCount: 2,
      },
      extra: {
        coinCount: 7,
        danmakuCount: 6,
      },
    })
    expect(workResult.snapshots).toHaveLength(1)
    expect(workResult.snapshots[0]).toMatchObject({
      platformWorkId: 'BV1xx411c7mD',
      work: {
        id: 'BV1xx411c7mD',
        title: 'Video title',
      },
      metrics: {
        viewCount: 100,
      },
    })

    expect(bilibiliService.getUserStat).toHaveBeenCalledWith('access-token')
    expect(bilibiliService.getArchiveStat).toHaveBeenCalledWith('access-token', 'BV1xx411c7mD')
  })
})
