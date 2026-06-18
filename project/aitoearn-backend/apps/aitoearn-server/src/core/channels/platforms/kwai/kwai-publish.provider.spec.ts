import type { MediaService } from '../../media/media.service'
import type { KwaiService } from './kwai.service'
import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { KwaiPublishProvider } from './kwai-publish.provider'
import { KwaiPublishResultStatus } from './kwai.constants'
import { KwaiPlatformException } from './kwai.exception'

vi.mock('@yikart/assets', () => ({
  AssetsService: class AssetsService {},
  VideoMetadataService: class VideoMetadataService {},
}))

vi.mock('@yikart/mongodb', () => ({
  AssetType: {
    PublishMedia: 'publishMedia',
  },
}))

describe('kwai publish provider validation', () => {
  it('accepts the current publish content contract', async () => {
    const provider = new KwaiPublishProvider({} as KwaiService, {} as MediaService)

    const result = await provider.validate({
      platform: AccountType.Kwai,
      accountId: 'account-id',
      content: {
        body: 'caption',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
        cover: { url: 'https://cdn.example.com/cover.jpg' },
      },
    })

    expect(result).toEqual({ valid: true })
  })

  it('uses Kwai photo_id for platformWorkId and canonical short-video permalink', async () => {
    const kwaiService = {
      startUpload: vi.fn(async () => ({ uploadToken: 'upload-token', endpoint: 'upload.example.test' })),
      fragmentUploadVideo: vi.fn(),
      completeFragmentUpload: vi.fn(),
      publishVideo: vi.fn(async () => ({ photoId: 'photo-1', playUrl: 'https://v.kuaishou.com/photo-1' })),
      getVideoInfo: vi.fn(async () => ({
        photoId: 'photo-1',
        caption: 'caption',
        cover: 'https://cdn.example.test/cover.jpg',
        playUrl: 'https://v.kuaishou.com/photo-1',
        createTime: 1,
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
        pending: false,
      })),
    } as unknown as KwaiService
    const mediaService = {
      getBuffer: vi.fn(async () => Buffer.from('media')),
    } as unknown as MediaService
    const provider = new KwaiPublishProvider(kwaiService, mediaService)

    await expect(provider.publish({
      taskId: 'task-1',
      platform: AccountType.Kwai,
      accountId: 'account-1',
      content: {
        body: 'caption',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
        cover: { url: 'https://cdn.example.com/cover.jpg' },
      },
      option: {
        photo_topic: 'legacy-topic',
        stereo_type: '2d',
      } as never,
      credential: {
        accessToken: 'access-token',
      },
    })).resolves.toEqual({
      status: KwaiPublishResultStatus.Processing,
      platformWorkId: 'photo-1',
      dataOption: {
        photoId: 'photo-1',
        publishPlayUrl: 'https://v.kuaishou.com/photo-1',
      },
    })
    expect(kwaiService.publishVideo).toHaveBeenCalledWith(
      'access-token',
      'caption',
      expect.any(Blob),
      'upload-token',
      { stereo_type: '2d' },
    )

    await expect(provider.finalize({
      taskId: 'task-1',
      platform: AccountType.Kwai,
      platformWorkId: 'photo-1',
      mediaJobs: [],
      dataOption: {
        photoId: 'photo-1',
        publishPlayUrl: 'https://v.kuaishou.com/photo-1',
      },
      credential: {
        accessToken: 'access-token',
      },
    })).resolves.toEqual({
      status: KwaiPublishResultStatus.Published,
      platformWorkId: 'photo-1',
      permalink: 'https://www.kuaishou.com/short-video/photo-1',
      dataOption: {
        photoId: 'photo-1',
        publishPlayUrl: 'https://v.kuaishou.com/photo-1',
        latestPlayUrl: 'https://v.kuaishou.com/photo-1',
      },
    })

    await expect(provider.verify({
      taskId: 'task-1',
      platform: AccountType.Kwai,
      platformWorkId: 'photo-1',
      dataOption: {
        photoId: 'photo-1',
      },
      credential: {
        accessToken: 'access-token',
      },
    })).resolves.toEqual({
      published: true,
      platformWorkId: 'photo-1',
      permalink: 'https://www.kuaishou.com/short-video/photo-1',
    })
  })

  it('keeps finalize pending when Kwai photo info is temporarily unavailable after publish', async () => {
    const kwaiService = {
      getVideoInfo: vi.fn(async () => {
        throw new KwaiPlatformException({
          code: ResponseCode.ChannelPlatformMediaProcessingFailed,
          category: PlatformErrorCategory.MediaProcessingFailed,
          cause: {
            type: PlatformErrorCauseType.Platform,
            platformCode: 100120001,
            platformMessage: 'VIDEO_NOT_EXIST',
          },
          retryable: true,
        })
      }),
    } as unknown as KwaiService
    const provider = new KwaiPublishProvider(kwaiService, {} as MediaService)

    await expect(provider.finalize({
      taskId: 'task-1',
      platform: AccountType.Kwai,
      platformWorkId: 'photo-1',
      mediaJobs: [],
      dataOption: {
        photoId: 'photo-1',
      },
      credential: {
        accessToken: 'access-token',
      },
    })).resolves.toEqual({
      status: KwaiPublishResultStatus.Processing,
      platformWorkId: 'photo-1',
      mediaJobs: [],
      dataOption: {
        photoId: 'photo-1',
      },
    })
  })
})
