import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { DouyinPublishProvider } from './douyin-publish.provider'
import { DouyinDownloadType, DouyinPrivateStatus } from './douyin.schema'

vi.mock('@yikart/assets', () => ({
  AssetsService: class {},
}))

vi.mock('../../../short-link/short-link.service', () => ({
  ShortLinkService: class {},
}))

vi.mock('./douyin.service', () => ({
  DouyinService: class {},
}))

function createProvider() {
  type ProviderDeps = ConstructorParameters<typeof DouyinPublishProvider>
  const douyinService = {
    getShareid: vi.fn().mockResolvedValue('share_1'),
    generateShareSchema: vi.fn().mockResolvedValue('snssdk1128://openplatform/share?state=share_1'),
    getSharePublishResult: vi.fn().mockResolvedValue({
      shareId: 'share_1',
      raw: {},
    }),
  }
  const assetsService = {
    buildUrl: vi.fn((url: string) => url.startsWith('http') ? url : `https://cdn.example.com/${url}`),
  }
  const shortLinkService = {
    create: vi.fn().mockResolvedValue('https://s.example.com/abc123'),
  }

  const provider = new DouyinPublishProvider(
    douyinService as unknown as ProviderDeps[0],
    assetsService as unknown as ProviderDeps[1],
    shortLinkService as unknown as ProviderDeps[2],
  )

  return { provider, douyinService, shortLinkService }
}

describe('douyin publish provider', () => {
  it('accepts handoff media in validate without resolving publish media', async () => {
    const { provider } = createProvider()

    await expect(provider.validate({
      platform: AccountType.Douyin,
      accountId: 'account_1',
      content: {
        body: 'body',
        media: [{ url: 'image-a.jpg', metadata: { type: 'image' } }],
      },
    })).resolves.toMatchObject({ valid: true })

    await expect(provider.validate({
      platform: AccountType.Douyin,
      accountId: 'account_1',
      content: {
        body: 'body',
        media: [
          { url: 'video-a.mp4', metadata: { type: 'video' } },
          { url: 'image-a.jpg', metadata: { type: 'image' } },
        ],
      },
    })).resolves.toMatchObject({ valid: true })
  })

  it('creates a user handoff schema and short link instead of platform upload', async () => {
    const { provider, douyinService, shortLinkService } = createProvider()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-08T00:00:00.000Z'))

    let result: Awaited<ReturnType<DouyinPublishProvider['publish']>> | undefined
    try {
      result = await provider.publish({
        taskId: 'task_1',
        platform: AccountType.Douyin,
        accountId: 'account_1',
        content: {
          title: 'short',
          body: 'body',
          media: [{ url: 'video-a.mp4', metadata: { type: 'video' } }],
        },
        option: {
          download_type: DouyinDownloadType.Allow,
          private_status: DouyinPrivateStatus.Public,
        },
        credential: {
          accessToken: 'access_token',
          platformUid: 'open_id',
        },
      })
    }
    finally {
      vi.useRealTimers()
    }

    expect(douyinService.getShareid).toHaveBeenCalled()
    expect(douyinService.generateShareSchema).toHaveBeenCalledWith(expect.objectContaining({
      shareId: 'share_1',
      title: 'body',
      short_title: 'short',
      video_path: 'https://cdn.example.com/video-a.mp4',
      download_type: DouyinDownloadType.Allow,
      private_status: DouyinPrivateStatus.Public,
    }))
    expect(shortLinkService.create).toHaveBeenCalledWith('snssdk1128://openplatform/share?state=share_1')
    expect(result).toMatchObject({
      status: 202,
      platformWorkId: 'share_1',
      userAction: {
        schema: 'snssdk1128://openplatform/share?state=share_1',
        shortLink: 'https://s.example.com/abc123',
        expiresAt: new Date('2026-06-08T01:00:00.000Z'),
        data: { shareId: 'share_1' },
      },
      dataOption: {
        shareId: 'share_1',
        schema: 'snssdk1128://openplatform/share?state=share_1',
        shortLink: 'https://s.example.com/abc123',
        expiresAt: '2026-06-08T01:00:00.000Z',
      },
    })
  })

  it('parses body topics into title hashtag list without requiring frontend options', async () => {
    const { provider, douyinService } = createProvider()

    await provider.publish({
      taskId: 'task_1',
      platform: AccountType.Douyin,
      accountId: 'account_1',
      content: {
        body: '测试 #重庆 标题 #北京',
        media: [{ url: 'video-a.mp4', metadata: { type: 'video' } }],
      },
      credential: {
        accessToken: 'access_token',
        platformUid: 'open_id',
      },
    })

    expect(douyinService.generateShareSchema).toHaveBeenCalledWith(expect.objectContaining({
      title: '测试 标题',
      title_hashtag_list: [
        { name: '重庆', start: 2 },
        { name: '北京', start: 5 },
      ],
    }))
  })

  it('allows user-controlled Douyin short title without overriding derived title topics', async () => {
    const { provider, douyinService } = createProvider()

    await provider.publish({
      taskId: 'task_1',
      platform: AccountType.Douyin,
      accountId: 'account_1',
      content: {
        body: '正文 #重庆 #北京',
        media: [{ url: 'video-a.mp4', metadata: { type: 'video' } }],
      },
      option: {
        short_title: '短标题',
      },
      credential: {
        accessToken: 'access_token',
        platformUid: 'open_id',
      },
    })

    expect(douyinService.generateShareSchema).toHaveBeenCalledWith(expect.objectContaining({
      title: '正文',
      short_title: '短标题',
      title_hashtag_list: [
        { name: '重庆', start: 2 },
        { name: '北京', start: 2 },
      ],
    }))
  })

  it('finalizes handoff publish with final video_id instead of item_id', async () => {
    const { provider, douyinService } = createProvider()
    douyinService.getSharePublishResult.mockResolvedValueOnce({
      shareId: 'share_1',
      itemId: 'item_1',
      videoId: 'video_1',
      shareUrl: 'https://www.douyin.com/video/video_1',
      raw: {
        share_id: 'share_1',
        item_id: 'item_1',
        video_id: 'video_1',
      },
    })

    const result = await provider.finalize({
      taskId: 'task_1',
      platform: AccountType.Douyin,
      platformWorkId: 'share_1',
      mediaJobs: [],
      dataOption: {
        shareId: 'share_1',
        schema: 'snssdk1128://openplatform/share?state=share_1',
        shortLink: 'https://s.example.com/abc123',
        expiresAt: '2026-06-04T00:00:00.000Z',
      },
      credential: {
        accessToken: 'access_token',
        platformUid: 'open_id',
      },
    })

    expect(douyinService.getSharePublishResult).toHaveBeenCalledWith('share_1')
    expect(result).toEqual({
      status: 200,
      platformWorkId: 'video_1',
      permalink: 'https://www.douyin.com/video/video_1',
      dataOption: {
        shareId: 'share_1',
        schema: 'snssdk1128://openplatform/share?state=share_1',
        shortLink: 'https://s.example.com/abc123',
        expiresAt: '2026-06-04T00:00:00.000Z',
        itemId: 'item_1',
        videoId: 'video_1',
        workLink: 'https://www.douyin.com/video/video_1',
      },
    })
  })

  it('keeps handoff publish pending when only item_id is available', async () => {
    const { provider, douyinService } = createProvider()
    douyinService.getSharePublishResult.mockResolvedValueOnce({
      shareId: 'share_1',
      itemId: 'item_1',
      raw: {
        share_id: 'share_1',
        item_id: 'item_1',
      },
    })

    const result = await provider.finalize({
      taskId: 'task_1',
      platform: AccountType.Douyin,
      platformWorkId: 'share_1',
      mediaJobs: [],
      dataOption: { shareId: 'share_1' },
      credential: {
        accessToken: 'access_token',
        platformUid: 'open_id',
      },
    })

    expect(result).toEqual({
      status: 202,
      platformWorkId: 'share_1',
      dataOption: {
        shareId: 'share_1',
        itemId: 'item_1',
      },
    })
  })

  it('verifies handoff publish with final video_id when webhook is absent', async () => {
    const { provider, douyinService } = createProvider()
    douyinService.getSharePublishResult.mockResolvedValueOnce({
      shareId: 'share_1',
      itemId: 'item_1',
      videoId: 'video_1',
      raw: {
        share_id: 'share_1',
        item_id: 'item_1',
        video_id: 'video_1',
      },
    })

    const result = await provider.verify({
      taskId: 'task_1',
      platform: AccountType.Douyin,
      platformWorkId: 'share_1',
      dataOption: { shareId: 'share_1' },
      credential: {
        accessToken: 'access_token',
        platformUid: 'open_id',
      },
    })

    expect(result).toEqual({
      published: true,
      platformWorkId: 'video_1',
      permalink: 'https://www.douyin.com/video/video_1',
    })
  })
})
