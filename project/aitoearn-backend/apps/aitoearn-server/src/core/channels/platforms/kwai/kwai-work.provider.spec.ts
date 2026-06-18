import { AccountType, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChannelPaginationMode } from '../platforms.interface'
import { KwaiWorkProvider } from './kwai-work.provider'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

const axiosGet = vi.mocked(axios.get)

function createProvider() {
  const kwaiService = {
    listPhotoPage: vi.fn(async () => ({
      items: [],
      rawResponse: {},
    })),
    getVideoInfo: vi.fn(),
  }
  return {
    provider: new KwaiWorkProvider(kwaiService as never),
    kwaiService,
  }
}

function createRedirectResponse(responseUrl: string, requestUrl = 'https://v.kuaishou.com/abc123') {
  return {
    request: {
      res: {
        responseUrl,
      },
    },
    config: {
      url: requestUrl,
    },
  }
}

describe('kwai work provider link info', () => {
  beforeEach(() => {
    axiosGet.mockReset()
  })

  it.each([
    ['https://www.kuaishou.com/short-video/photo-1?fid=1', 'photo-1'],
    ['https://www.kuaishou.com/video/photo-2', 'photo-2'],
    ['https://c.kuaishou.com/fw/photo/photo-3?cc=share', 'photo-3'],
  ])('parses Kwai photo_id from %s', async (link, expectedId) => {
    const { provider } = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Kwai,
      link,
    })).resolves.toMatchObject({
      work: {
        id: expectedId,
        url: `https://www.kuaishou.com/short-video/${expectedId}`,
      },
      extra: {
        dataId: expectedId,
        uniqueId: `${AccountType.Kwai}_${expectedId}`,
        resolvedUrl: link,
      },
    })
  })

  it('resolves Kwai short links before parsing photo_id', async () => {
    const { provider } = createProvider()
    axiosGet.mockResolvedValue(createRedirectResponse('https://www.kuaishou.com/short-video/photo-4?from=short'))

    await expect(provider.getLinkInfo({
      platform: AccountType.Kwai,
      link: 'https://v.kuaishou.com/abc123',
    })).resolves.toMatchObject({
      work: {
        id: 'photo-4',
        url: 'https://www.kuaishou.com/short-video/photo-4',
      },
      extra: {
        dataId: 'photo-4',
        resolvedUrl: 'https://www.kuaishou.com/short-video/photo-4?from=short',
      },
      rawResponse: {
        resolvedUrl: 'https://www.kuaishou.com/short-video/photo-4?from=short',
      },
    })

    expect(axiosGet).toHaveBeenCalledWith(
      'https://v.kuaishou.com/abc123',
      expect.objectContaining({
        maxRedirects: 5,
        timeout: 10000,
      }),
    )
  })

  it('rejects short links when redirect resolution fails', async () => {
    const { provider } = createProvider()
    axiosGet.mockRejectedValue(new Error('network failed'))

    await expect(provider.getLinkInfo({
      platform: AccountType.Kwai,
      link: 'https://v.kuaishou.com/abc123',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })

  it('does not fall back to input dataId when the link is invalid', async () => {
    const { provider } = createProvider()

    await expect(provider.getLinkInfo({
      platform: AccountType.Kwai,
      link: 'https://example.com/video/photo-5',
      dataId: 'photo-5',
    })).rejects.toMatchObject({
      code: ResponseCode.InvalidWorkLink,
    })
  })

  it('lists Kwai works with official photo metrics', async () => {
    const { provider, kwaiService } = createProvider()
    kwaiService.listPhotoPage.mockResolvedValueOnce({
      items: [{
        photo_id: 'photo-new',
        caption: 'new caption',
        cover: 'https://cdn.example.test/cover.jpg',
        play_url: 'https://v.kuaishou.com/photo-new',
        create_time: 1717200001000,
        like_count: 12,
        comment_count: 3,
        view_count: 456,
        pending: false,
      }, {
        photo_id: 'photo-old',
        caption: 'old caption',
        cover: 'https://cdn.example.test/cover-old.jpg',
        play_url: 'https://v.kuaishou.com/photo-old',
        create_time: 1717200000,
        like_count: 1,
        comment_count: 2,
        view_count: 3,
        pending: true,
      }],
      rawResponse: {},
    })

    await expect(provider.listWorks({
      accountId: 'account-1',
      platform: AccountType.Kwai,
      credential: { accessToken: 'access-token' },
      pagination: { cursor: 'cursor-1', limit: 10 },
    })).resolves.toEqual({
      items: [{
        platformWorkId: 'photo-new',
        contentMode: 'video',
        title: 'new caption',
        description: 'new caption',
        url: 'https://www.kuaishou.com/short-video/photo-new',
        coverUrl: 'https://cdn.example.test/cover.jpg',
        publishedAt: new Date(1717200001000),
        status: 'published',
        metrics: {
          viewCount: 456,
          likeCount: 12,
          commentCount: 3,
        },
      }, {
        platformWorkId: 'photo-old',
        contentMode: 'video',
        title: 'old caption',
        description: 'old caption',
        url: 'https://www.kuaishou.com/short-video/photo-old',
        coverUrl: 'https://cdn.example.test/cover-old.jpg',
        publishedAt: new Date(1717200000 * 1000),
        status: 'pending',
        metrics: {
          viewCount: 3,
          likeCount: 1,
          commentCount: 2,
        },
      }],
      pagination: {
        mode: ChannelPaginationMode.Cursor,
        nextCursor: 'photo-old',
        hasNext: false,
        hasPrevious: false,
        limit: 10,
      },
    })
    expect(kwaiService.listPhotoPage).toHaveBeenCalledWith('access-token', 'cursor-1', 10)
  })

  it('gets Kwai work detail and verifies ownership through photo info', async () => {
    const { provider, kwaiService } = createProvider()
    kwaiService.getVideoInfo.mockResolvedValue({
      photoId: 'photo-1',
      caption: 'caption',
      cover: 'https://cdn.example.test/cover.jpg',
      playUrl: 'https://v.kuaishou.com/photo-1',
      createTime: 1717200000,
      likeCount: 12,
      commentCount: 3,
      viewCount: 456,
      pending: true,
    })

    await expect(provider.getDetail({
      accountId: 'account-1',
      platform: AccountType.Kwai,
      platformWorkId: 'photo-1',
      credential: { accessToken: 'access-token' },
    })).resolves.toMatchObject({
      work: {
        id: 'photo-1',
        title: 'caption',
        url: 'https://www.kuaishou.com/short-video/photo-1',
        status: 'pending',
      },
      metrics: {
        viewCount: 456,
        likeCount: 12,
        commentCount: 3,
      },
      extra: {
        pending: true,
      },
    })

    await expect(provider.verifyOwnership({
      accountId: 'account-1',
      platform: AccountType.Kwai,
      platformWorkId: 'photo-1',
      credential: { accessToken: 'access-token' },
    })).resolves.toBe(true)
  })
})
