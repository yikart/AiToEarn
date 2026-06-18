import type { MediaService } from '../../media/media.service'
import type { TwitterService } from './twitter.service'
import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PublishValidationIssueCode } from '../publish.schema'
import { TwitterPublishProvider } from './twitter-publish.provider'

vi.mock('@yikart/assets', () => ({
  AssetsService: class AssetsService {},
  VideoMetadataService: class VideoMetadataService {},
}))

vi.mock('@yikart/mongodb', () => ({
  AccountRepository: class AccountRepository {},
  AssetType: {
    PublishMedia: 'publishMedia',
  },
  Transactional: () => () => undefined,
}))

describe('twitter publish provider', () => {
  it('rejects mixed media and excessive media during validation', async () => {
    const provider = new TwitterPublishProvider({} as TwitterService, {} as MediaService)

    await expect(provider.validate({
      accountId: 'account-1',
      platform: AccountType.Twitter,
      content: {
        media: [
          { url: 'https://cdn.example.test/image', metadata: { type: 'image' } },
          { url: 'https://cdn.example.test/video', metadata: { type: 'video' } },
        ],
      },
    })).resolves.toEqual({
      valid: false,
      issues: [expect.objectContaining({ code: PublishValidationIssueCode.InvalidCombination })],
    })

    await expect(provider.validate({
      accountId: 'account-1',
      platform: AccountType.Twitter,
      content: {
        media: [
          { url: 'https://cdn.example.test/1', metadata: { type: 'image' } },
          { url: 'https://cdn.example.test/2', metadata: { type: 'image' } },
          { url: 'https://cdn.example.test/3', metadata: { type: 'image' } },
          { url: 'https://cdn.example.test/4', metadata: { type: 'image' } },
          { url: 'https://cdn.example.test/5', metadata: { type: 'image' } },
        ],
      },
    })).resolves.toEqual({
      valid: false,
      issues: [expect.objectContaining({ code: PublishValidationIssueCode.TooBig })],
    })
  })

  it('fails locally for mixed media before uploading', async () => {
    const twitterService = {
      initMediaUpload: vi.fn(),
      createPost: vi.fn(),
    } as unknown as TwitterService
    const mediaService = {
      getBuffer: vi.fn(),
    } as unknown as MediaService
    const provider = new TwitterPublishProvider(twitterService, mediaService)

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.Twitter,
      accountId: 'account-1',
      content: {
        body: 'caption',
        media: [
          { url: 'https://cdn.example.test/image', metadata: { type: 'image' } },
          { url: 'https://cdn.example.test/video', metadata: { type: 'video' } },
        ],
      },
      credential: {
        accessToken: 'access-token',
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformMediaUnsupported,
    })

    expect(mediaService.getBuffer).not.toHaveBeenCalled()
    expect(twitterService.initMediaUpload).not.toHaveBeenCalled()
    expect(twitterService.createPost).not.toHaveBeenCalled()
  })

  it('waits for video media processing before creating the tweet', async () => {
    const twitterService = {
      initMediaUpload: vi.fn(async () => ({ mediaId: 'media-1' })),
      appendMediaUpload: vi.fn(),
      finalizeMediaUpload: vi.fn(async () => ({
        mediaId: 'media-1',
        processingInfo: {
          state: 'pending',
          checkAfterSecs: 0,
        },
      })),
      getMediaStatus: vi.fn(async () => ({
        mediaId: 'media-1',
        processingInfo: {
          state: 'succeeded',
          progressPercent: 100,
        },
      })),
      createMediaMetadata: vi.fn(),
      createPost: vi.fn(async () => ({
        postId: 'tweet-1',
        permalink: 'https://x.com/i/status/tweet-1',
      })),
    } as unknown as TwitterService
    const mediaService = {
      getBuffer: vi.fn(async () => Buffer.from('video-data')),
    } as unknown as MediaService
    const provider = new TwitterPublishProvider(twitterService, mediaService)

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.Twitter,
      accountId: 'account-1',
      content: {
        body: 'caption',
        media: [{ url: 'https://cdn.example.test/video', metadata: { type: 'video' } }],
      },
      credential: {
        accessToken: 'access-token',
      },
    })).resolves.toEqual({
      status: 200,
      platformWorkId: 'tweet-1',
      permalink: 'https://x.com/i/status/tweet-1',
    })

    expect(twitterService.getMediaStatus).toHaveBeenCalledWith('access-token', 'media-1')
    expect(twitterService.initMediaUpload).toHaveBeenCalledWith('access-token', expect.objectContaining({
      mediaType: 'video/mp4',
      mediaCategory: 'tweet_video',
    }))
    expect(twitterService.createPost).toHaveBeenCalledWith('access-token', expect.objectContaining({
      mediaIds: ['media-1'],
    }))
    expect(vi.mocked(twitterService.getMediaStatus).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(twitterService.createPost).mock.invocationCallOrder[0])
  })

  it('waits for gif media processing before creating the tweet', async () => {
    const twitterService = {
      initMediaUpload: vi.fn(async () => ({ mediaId: 'media-1' })),
      appendMediaUpload: vi.fn(),
      finalizeMediaUpload: vi.fn(async () => ({
        mediaId: 'media-1',
        processingInfo: {
          state: 'pending',
          checkAfterSecs: 0,
        },
      })),
      getMediaStatus: vi.fn(async () => ({
        mediaId: 'media-1',
        processingInfo: {
          state: 'succeeded',
          progressPercent: 100,
        },
      })),
      createMediaMetadata: vi.fn(),
      createPost: vi.fn(async () => ({
        postId: 'tweet-1',
        permalink: 'https://x.com/i/status/tweet-1',
      })),
    } as unknown as TwitterService
    const mediaService = {
      getBuffer: vi.fn(async () => Buffer.from('gif-data')),
    } as unknown as MediaService
    const provider = new TwitterPublishProvider(twitterService, mediaService)

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.Twitter,
      accountId: 'account-1',
      content: {
        body: 'caption',
        media: [{ url: 'https://cdn.example.test/animation.gif', metadata: { type: 'image' } }],
      },
      credential: {
        accessToken: 'access-token',
      },
    })).resolves.toMatchObject({
      status: 200,
      platformWorkId: 'tweet-1',
    })

    expect(twitterService.initMediaUpload).toHaveBeenCalledWith('access-token', expect.objectContaining({
      mediaType: 'image/gif',
      mediaCategory: 'tweet_gif',
    }))
    expect(twitterService.getMediaStatus).toHaveBeenCalledWith('access-token', 'media-1')
    expect(vi.mocked(twitterService.getMediaStatus).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(twitterService.createPost).mock.invocationCallOrder[0])
  })
})
