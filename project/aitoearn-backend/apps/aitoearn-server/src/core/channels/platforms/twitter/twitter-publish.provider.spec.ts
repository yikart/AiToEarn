import type { MediaService } from '../../media/media.service'
import type { TwitterService } from './twitter.service'
import { Readable } from 'node:stream'
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

function createMediaService(buffer: Buffer, contentType = 'video/mp4'): MediaService {
  return {
    withUploadSource: vi.fn(async (_input, handler) => handler({
      sizeBytes: buffer.length,
      contentType,
      filename: 'media',
      stream: range => Readable.from(buffer.subarray(range?.start ?? 0, range ? range.end + 1 : buffer.length)),
      blob: async range => new Blob([new Uint8Array(buffer.subarray(range?.start ?? 0, range ? range.end + 1 : buffer.length))], { type: contentType }),
    })),
  } as unknown as MediaService
}

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
      withUploadSource: vi.fn(),
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

    expect(mediaService.withUploadSource).not.toHaveBeenCalled()
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
    const videoBuffer = Buffer.from('video-data')
    const mediaService = createMediaService(videoBuffer)
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
    expect(twitterService.appendMediaUpload).toHaveBeenCalledWith('access-token', {
      mediaId: 'media-1',
      media: expect.any(Blob),
      segmentIndex: 0,
    })
    expect(twitterService.createPost).toHaveBeenCalledWith('access-token', expect.objectContaining({
      mediaIds: ['media-1'],
    }))
    expect(vi.mocked(twitterService.getMediaStatus).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(twitterService.createPost).mock.invocationCallOrder[0])
  })

  it('uploads video media in 1 MiB append chunks', async () => {
    const twitterService = {
      initMediaUpload: vi.fn(async () => ({ mediaId: 'media-1' })),
      appendMediaUpload: vi.fn(),
      finalizeMediaUpload: vi.fn(async () => ({
        mediaId: 'media-1',
      })),
      getMediaStatus: vi.fn(),
      createMediaMetadata: vi.fn(),
      createPost: vi.fn(async () => ({
        postId: 'tweet-1',
        permalink: 'https://x.com/i/status/tweet-1',
      })),
    } as unknown as TwitterService
    const videoBuffer = Buffer.alloc(3 * 1024 * 1024, 1)
    const mediaService = createMediaService(videoBuffer)
    const provider = new TwitterPublishProvider(twitterService, mediaService)

    await provider.publish({
      taskId: 'task-1',
      platform: AccountType.Twitter,
      accountId: 'account-1',
      content: {
        body: 'caption',
        media: [{ url: 'https://cdn.example.test/video.mp4', metadata: { type: 'video' } }],
      },
      credential: {
        accessToken: 'access-token',
      },
    })

    expect(twitterService.appendMediaUpload).toHaveBeenCalledTimes(3)
    const appendCalls = vi.mocked(twitterService.appendMediaUpload).mock.calls
    await Promise.all(appendCalls.map(async ([accessToken, params], index) => {
      const chunkStart = index * 1024 * 1024
      const expectedChunk = videoBuffer.subarray(chunkStart, chunkStart + 1024 * 1024)
      expect(accessToken).toBe('access-token')
      expect(params.mediaId).toBe('media-1')
      expect(params.segmentIndex).toBe(index)
      expect(params.media.size).toBe(expectedChunk.length)
      expect(Buffer.from(await params.media.arrayBuffer()).equals(expectedChunk)).toBe(true)
    }))
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
    const mediaService = createMediaService(Buffer.from('gif-data'), 'image/gif')
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
