import { Readable } from 'node:stream'
import { ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { PublishValidationIssueCode } from '../publish.schema'
import { PinterestPublishProvider } from './pinterest-publish.provider'
import { PinterestPlatformException } from './pinterest.exception'
import { PinterestMediaStatusValue } from './pinterest.interface'

vi.mock('../../media/media.service', () => ({
  MediaService: class {},
}))

vi.mock('./pinterest.service', () => ({
  PinterestService: class {},
}))

vi.mock('@yikart/mongodb', () => ({
  PublishRecordLinkStatus: {
    PENDING: 'pending',
    READY: 'ready',
    FAILED: 'failed',
  },
}))

function createProvider() {
  const video = Buffer.from('video')
  const pinterestService = {
    createPin: vi.fn(),
    getPin: vi.fn(),
    deletePin: vi.fn(),
    updatePin: vi.fn(),
    createVideoMediaUpload: vi.fn(),
    uploadVideoMedia: vi.fn(),
    getMediaStatus: vi.fn(),
  }
  const mediaService = {
    withUploadSource: vi.fn(async (_input, handler) => handler({
      sizeBytes: video.length,
      contentType: 'video/mp4',
      filename: 'video.mp4',
      stream: range => Readable.from(video.subarray(range?.start ?? 0, range ? range.end + 1 : video.length)),
      blob: async range => new Blob([new Uint8Array(video.subarray(range?.start ?? 0, range ? range.end + 1 : video.length))], { type: 'video/mp4' }),
    })),
  }
  return {
    provider: new PinterestPublishProvider(pinterestService as never, mediaService as never),
    pinterestService,
    mediaService,
  }
}

const baseInput = {
  platform: 'pinterest' as never,
  accountId: 'account-id',
  content: { media: [] },
}

describe('pinterest publish provider validation', () => {
  it('requires a board id and at least one media item', async () => {
    const { provider } = createProvider()

    const result = await provider.validate({
      ...baseInput,
      option: undefined,
    })

    expect(result.valid).toBe(false)
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: PublishValidationIssueCode.Required, path: ['option', 'boardId'] }),
      expect.objectContaining({ code: PublishValidationIssueCode.Required, path: ['content', 'media'] }),
    ]))
  })

  it('requires a cover image for video pins', async () => {
    const { provider } = createProvider()

    const result = await provider.validate({
      ...baseInput,
      content: { media: [{ url: 'https://cdn.example.test/video.mp4' }] },
      option: { boardId: 'board-id' },
    })

    expect(result.valid).toBe(false)
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: PublishValidationIssueCode.Required, path: ['option', 'coverImageUrl'] }),
    ]))
  })

  it('treats extensionless media as video when metadata declares video', async () => {
    const { provider } = createProvider()

    const result = await provider.validate({
      ...baseInput,
      content: { media: [{ url: 'https://cdn.example.test/signed-media', metadata: { type: 'video' } }] },
      option: { boardId: 'board-id' },
    })

    expect(result.valid).toBe(false)
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: PublishValidationIssueCode.Required, path: ['option', 'coverImageUrl'] }),
    ]))
  })

  it('accepts a single image pin with a board id', async () => {
    const { provider } = createProvider()

    const result = await provider.validate({
      ...baseInput,
      content: { media: [{ url: 'https://cdn.example.test/image.jpg' }] },
      option: { boardId: 'board-id' },
    })

    expect(result.valid).toBe(true)
  })
})

describe('pinterest publish provider result links', () => {
  it('passes destination links to the API without using them as permalinks', async () => {
    const { provider, pinterestService } = createProvider()
    const destinationLink = 'https://merchant.example.test/product'
    pinterestService.createPin.mockResolvedValue({
      id: 'created-pin-id',
      link: destinationLink,
    })
    pinterestService.getPin.mockResolvedValue({
      id: 'final-pin-id',
      link: destinationLink,
    })

    await expect(provider.publish({
      taskId: 'task-id',
      accountId: 'account-id',
      credential: { accessToken: 'access-token' },
      content: {
        title: 'Pin title',
        body: 'Pin description',
        media: [{ url: 'https://cdn.example.test/image.jpg' }],
      },
      option: {
        boardId: 'board-id',
        link: destinationLink,
      },
    } as never)).resolves.toEqual({
      status: 200,
      platformWorkId: 'final-pin-id',
      permalink: 'https://www.pinterest.com/pin/final-pin-id/',
      linkStatus: 'ready',
    })

    expect(pinterestService.createPin).toHaveBeenCalledWith(
      'access-token',
      expect.objectContaining({
        boardId: 'board-id',
        link: destinationLink,
        imageUrl: 'https://cdn.example.test/image.jpg',
      }),
    )
  })

  it('keeps created pins successful when getPin is temporarily unavailable', async () => {
    const { provider, pinterestService } = createProvider()
    pinterestService.createPin.mockResolvedValue({
      id: 'created-pin-id',
    })
    pinterestService.getPin.mockRejectedValue(new Error('not ready'))

    await expect(provider.publish({
      taskId: 'task-id',
      accountId: 'account-id',
      credential: { accessToken: 'access-token' },
      content: {
        title: 'Pin title',
        body: 'Pin description',
        media: [{ url: 'https://cdn.example.test/image.jpg' }],
      },
      option: {
        boardId: 'board-id',
      },
    } as never)).resolves.toEqual({
      status: 200,
      platformWorkId: 'created-pin-id',
      permalink: 'https://www.pinterest.com/pin/created-pin-id/',
      linkStatus: 'pending',
    })
  })

  it('marks video processing timeout as a retryable platform timeout', async () => {
    vi.useFakeTimers()
    try {
      const { provider, pinterestService } = createProvider()
      pinterestService.createVideoMediaUpload.mockResolvedValue({
        media_id: 'media-1',
        upload_url: 'https://upload.example.test/video',
        upload_parameters: {},
      })
      pinterestService.getMediaStatus.mockResolvedValue({
        media_id: 'media-1',
        status: PinterestMediaStatusValue.Processing,
      })

      const errorPromise = provider.publish({
        taskId: 'task-id',
        accountId: 'account-id',
        credential: { accessToken: 'access-token' },
        content: {
          title: 'Pin title',
          body: 'Pin description',
          media: [{ url: 'https://cdn.example.test/video.mp4' }],
        },
        option: {
          boardId: 'board-id',
          coverImageUrl: 'https://cdn.example.test/cover.jpg',
        },
      } as never).catch(err => err)
      await vi.advanceTimersByTimeAsync(4999)
      expect(pinterestService.getMediaStatus).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      expect(pinterestService.getMediaStatus).toHaveBeenCalledTimes(1)
      await vi.runAllTimersAsync()
      const error = await errorPromise

      expect(error).toBeInstanceOf(PinterestPlatformException)
      expect(error).toMatchObject({
        code: ResponseCode.ChannelPlatformMediaProcessingTimeout,
        category: PlatformErrorCategory.Timeout,
        retryable: true,
        platformCause: {
          type: PlatformErrorCauseType.Platform,
          platformCode: PinterestMediaStatusValue.Processing,
        },
      })
      expect(pinterestService.getMediaStatus).toHaveBeenCalledTimes(60)
      expect(pinterestService.createPin).not.toHaveBeenCalled()
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('marks failed video media status as a platform media processing failure', async () => {
    vi.useFakeTimers()
    try {
      const { provider, pinterestService } = createProvider()
      pinterestService.createVideoMediaUpload.mockResolvedValue({
        media_id: 'media-1',
        upload_url: 'https://upload.example.test/video',
        upload_parameters: {},
      })
      pinterestService.getMediaStatus.mockResolvedValue({
        media_id: 'media-1',
        status: PinterestMediaStatusValue.Failed,
      })

      const assertion = expect(provider.publish({
        taskId: 'task-id',
        accountId: 'account-id',
        credential: { accessToken: 'access-token' },
        content: {
          title: 'Pin title',
          body: 'Pin description',
          media: [{ url: 'https://cdn.example.test/video.mp4' }],
        },
        option: {
          boardId: 'board-id',
          coverImageUrl: 'https://cdn.example.test/cover.jpg',
        },
      } as never)).rejects.toMatchObject({
        code: ResponseCode.ChannelPlatformMediaProcessingFailed,
        category: PlatformErrorCategory.MediaProcessingFailed,
        retryable: false,
        platformCause: {
          type: PlatformErrorCauseType.Platform,
          platformCode: PinterestMediaStatusValue.Failed,
        },
      })
      await vi.runAllTimersAsync()
      await assertion
      expect(pinterestService.createPin).not.toHaveBeenCalled()
    }
    finally {
      vi.useRealTimers()
    }
  })
})
