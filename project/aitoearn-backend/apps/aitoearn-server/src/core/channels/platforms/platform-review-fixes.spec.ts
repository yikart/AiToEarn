import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { FacebookWorkProvider } from './facebook/facebook-work.provider'
import { PinterestWorkProvider } from './pinterest/pinterest-work.provider'
import { ChannelPaginationDirection, PublishContentMode } from './platforms.interface'
import {
  formatPublishValidationIssue,
  PublishValidationField,
  PublishValidationIssueCode,
} from './publish.schema'
import { ThreadsAnalyticsProvider } from './threads/threads-analytics.provider'
import { ThreadsWorkProvider } from './threads/threads-work.provider'
import { TwitterEngagementProvider } from './twitter/twitter-engagement.provider'
import { TwitterWorkProvider } from './twitter/twitter-work.provider'

vi.mock('./facebook/facebook.service', () => ({
  FacebookService: class FacebookService {},
}))

vi.mock('./pinterest/pinterest.service', () => ({
  PinterestService: class PinterestService {},
}))

vi.mock('./threads/threads.service', () => ({
  ThreadsService: class ThreadsService {},
}))

vi.mock('./twitter/twitter.service', () => ({
  TwitterService: class TwitterService {},
}))

describe('platform review fixes', () => {
  it('reads Twitter engagement next cursor from camelCase meta.nextToken', async () => {
    const twitterService = {
      listReplies: vi.fn(async () => ({
        data: [],
        meta: { nextToken: 'next-token-1' },
      })),
    }
    const provider = new TwitterEngagementProvider(twitterService as never)

    await expect(provider.listComments({
      accountId: 'account-1',
      platform: AccountType.Twitter,
      platformWorkId: 'tweet-1',
      credential: { accessToken: 'access-token' },
      pagination: {
        limit: 10,
      },
    })).resolves.toMatchObject({
      pagination: {
        nextCursor: 'next-token-1',
        hasNext: true,
      },
    })
  })

  it('reads Twitter works next cursor from camelCase meta.nextToken', async () => {
    const twitterService = {
      listWorks: vi.fn(async () => ({
        data: [{ id: 'tweet-1', text: 'hello' }],
        meta: { nextToken: 'next-token-1' },
      })),
    }
    const provider = new TwitterWorkProvider(twitterService as never)

    await expect(provider.listWorks({
      accountId: 'account-1',
      platform: AccountType.Twitter,
      credential: { accessToken: 'access-token', platformUid: 'user-1' },
      pagination: {
        limit: 10,
      },
    })).resolves.toMatchObject({
      pagination: {
        nextCursor: 'next-token-1',
        hasNext: true,
      },
    })
  })

  it('maps Twitter media works by attached media type', async () => {
    const twitterService = {
      listWorks: vi.fn(async () => ({
        data: [
          { id: 'tweet-photo', text: 'photo', attachments: { media_keys: ['media-photo'] } },
          { id: 'tweet-video', text: 'video', attachments: { mediaKeys: ['media-video'] } },
          { id: 'tweet-text', text: 'text' },
        ],
        includes: {
          media: [
            { media_key: 'media-photo', type: 'photo' },
            { mediaKey: 'media-video', type: 'video' },
          ],
        },
      })),
    }
    const provider = new TwitterWorkProvider(twitterService as never)

    await expect(provider.listWorks({
      accountId: 'account-1',
      platform: AccountType.Twitter,
      credential: { accessToken: 'access-token', platformUid: 'user-1' },
      pagination: {
        limit: 10,
      },
    })).resolves.toMatchObject({
      items: [
        { platformWorkId: 'tweet-photo', contentMode: PublishContentMode.ImageText },
        { platformWorkId: 'tweet-video', contentMode: PublishContentMode.Video },
        { platformWorkId: 'tweet-text', contentMode: PublishContentMode.Text },
      ],
    })
  })

  it('rejects Twitter works requests without platform user id before calling the platform', async () => {
    const twitterService = {
      listWorks: vi.fn(),
      verifyOwnership: vi.fn(),
    }
    const provider = new TwitterWorkProvider(twitterService as never)

    await expect(provider.listWorks({
      accountId: 'account-1',
      platform: AccountType.Twitter,
      credential: { accessToken: 'access-token' },
      pagination: {
        limit: 10,
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformAccountMissing,
    })

    await expect(provider.verifyOwnership({
      accountId: 'account-1',
      platform: AccountType.Twitter,
      platformWorkId: 'tweet-1',
      credential: { accessToken: 'access-token' },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformAccountMissing,
    })

    expect(twitterService.listWorks).not.toHaveBeenCalled()
    expect(twitterService.verifyOwnership).not.toHaveBeenCalled()
  })

  it('returns Pinterest pin permalinks instead of destination links', async () => {
    const pinterestService = {
      listPins: vi.fn(async () => ({
        list: [
          {
            id: 'pin-1',
            title: 'Pin title',
            link: 'https://merchant.example.test/product',
            media: { media_type: 'image' },
          },
        ],
      })),
      getPin: vi.fn(async () => ({
        id: 'pin-1',
        title: 'Pin title',
        link: 'https://merchant.example.test/product',
        media: { media_type: 'image' },
      })),
    }
    const provider = new PinterestWorkProvider(pinterestService as never)

    await expect(provider.listWorks({
      accountId: 'account-1',
      platform: AccountType.Pinterest,
      credential: { accessToken: 'access-token', platformUid: 'user-1' },
      pagination: {
        limit: 10,
      },
    })).resolves.toMatchObject({
      items: [
        { platformWorkId: 'pin-1', url: 'https://www.pinterest.com/pin/pin-1/' },
      ],
    })

    await expect(provider.getDetail({
      accountId: 'account-1',
      platform: AccountType.Pinterest,
      platformWorkId: 'pin-1',
      credential: { accessToken: 'access-token', platformUid: 'user-1' },
    })).resolves.toMatchObject({
      work: {
        id: 'pin-1',
        url: 'https://www.pinterest.com/pin/pin-1/',
      },
      extra: {
        destinationUrl: 'https://merchant.example.test/product',
      },
    })
  })

  it('keeps Facebook video works as video even when they have thumbnails', async () => {
    const facebookService = {
      listPagePosts: vi.fn(async () => ({
        data: [
          {
            id: 'post-video',
            message: 'video post',
            full_picture: 'https://cdn.example.test/video-thumb.jpg',
            attachments: {
              data: [{ media_type: 'video', type: 'video_inline' }],
            },
          },
          {
            id: 'post-image',
            message: 'image post',
            full_picture: 'https://cdn.example.test/image.jpg',
          },
          {
            id: 'post-text',
            message: 'text post',
          },
        ],
      })),
    }
    const provider = new FacebookWorkProvider(facebookService as never)

    await expect(provider.listWorks({
      accountId: 'account-1',
      platform: AccountType.Facebook,
      credential: { accessToken: 'access-token', platformUid: 'page-1' },
      pagination: {
        limit: 10,
      },
    })).resolves.toMatchObject({
      items: [
        { platformWorkId: 'post-video', contentMode: PublishContentMode.Video },
        { platformWorkId: 'post-image', contentMode: PublishContentMode.ImageText },
        { platformWorkId: 'post-text', contentMode: PublishContentMode.Text },
      ],
    })
  })

  it('keeps Threads text media types as text works', async () => {
    const threadsService = {
      listWorks: vi.fn(async () => ({
        data: [
          { id: 'thread-1', media_type: 'TEXT', text: 'text post' },
          { id: 'thread-2', media_type: 'text', text: 'lowercase text post' },
        ],
      })),
    }
    const provider = new ThreadsWorkProvider(threadsService as never)

    await expect(provider.listWorks({
      accountId: 'account-1',
      platform: AccountType.Threads,
      credential: { accessToken: 'access-token', platformUid: 'threads-user-1' },
      pagination: {
        limit: 25,
        direction: ChannelPaginationDirection.Next,
      },
    })).resolves.toMatchObject({
      items: [
        { platformWorkId: 'thread-1', contentMode: PublishContentMode.Text },
        { platformWorkId: 'thread-2', contentMode: PublishContentMode.Text },
      ],
    })
  })

  it('rejects Threads works and account analytics without platform user id before calling the platform', async () => {
    const threadsService = {
      listWorks: vi.fn(),
      getPublishedPost: vi.fn(),
      getAccountInsights: vi.fn(),
    }
    const workProvider = new ThreadsWorkProvider(threadsService as never)
    const analyticsProvider = new ThreadsAnalyticsProvider(threadsService as never)

    await expect(workProvider.listWorks({
      accountId: 'account-1',
      platform: AccountType.Threads,
      credential: { accessToken: 'access-token' },
      pagination: {
        limit: 25,
        direction: ChannelPaginationDirection.Next,
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformAccountMissing,
    })

    await expect(workProvider.verifyOwnership({
      accountId: 'account-1',
      platform: AccountType.Threads,
      platformWorkId: 'thread-1',
      credential: { accessToken: 'access-token' },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformAccountMissing,
    })

    await expect(analyticsProvider.fetchAccountAnalytics({
      accountId: 'account-1',
      platform: AccountType.Threads,
      credential: { accessToken: 'access-token' },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformAccountMissing,
    })

    expect(threadsService.listWorks).not.toHaveBeenCalled()
    expect(threadsService.getPublishedPost).not.toHaveBeenCalled()
    expect(threadsService.getAccountInsights).not.toHaveBeenCalled()
  })

  it('formats unsupported media formats from allowed params', () => {
    expect(formatPublishValidationIssue({
      code: PublishValidationIssueCode.UnsupportedFormat,
      path: ['content', 'media', 0],
      params: {
        field: PublishValidationField.Media,
        allowed: 'jpg, png, webp',
      },
    }, 'zh-CN').message).toBe('媒体格式不支持，支持格式：jpg, png, webp')
  })

  it('formats byte, pixel, and second units in validation messages', () => {
    expect(formatPublishValidationIssue({
      code: PublishValidationIssueCode.TooBig,
      path: ['content', 'image'],
      params: {
        field: PublishValidationField.Image,
        maximum: 5242880,
        unit: 'bytes',
      },
    }, 'zh-CN').message).toBe('图片不能超过 5242880 字节')

    expect(formatPublishValidationIssue({
      code: PublishValidationIssueCode.TooSmall,
      path: ['content', 'image'],
      params: {
        field: PublishValidationField.Image,
        minimum: 320,
        unit: 'pixels',
      },
    }, 'zh-CN').message).toBe('图片不能少于 320 像素')

    expect(formatPublishValidationIssue({
      code: PublishValidationIssueCode.TooBig,
      path: ['content', 'video'],
      params: {
        field: PublishValidationField.Video,
        maximum: 60,
        unit: 'seconds',
      },
    }, 'en-US').message).toBe('Video must be at most 60 seconds')
  })

  it('formats legacy publish content mode values in unsupported mode messages', () => {
    expect(formatPublishValidationIssue({
      code: PublishValidationIssueCode.UnsupportedContentMode,
      path: ['content'],
      params: { mode: PublishContentMode.Text },
    }, 'zh-CN').message).toBe('平台不支持纯文本发布')

    expect(formatPublishValidationIssue({
      code: PublishValidationIssueCode.UnsupportedContentMode,
      path: ['content'],
      params: { mode: PublishContentMode.ImageText },
    }, 'zh-CN').message).toBe('平台不支持图文发布')

    expect(formatPublishValidationIssue({
      code: PublishValidationIssueCode.UnsupportedContentMode,
      path: ['content'],
      params: { mode: PublishContentMode.Video },
    }, 'en-US').message).toBe('Platform does not support video publishing')
  })
})
