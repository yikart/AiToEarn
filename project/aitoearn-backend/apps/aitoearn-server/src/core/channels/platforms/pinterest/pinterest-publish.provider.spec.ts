import { describe, expect, it, vi } from 'vitest'
import { PublishValidationIssueCode } from '../publish.schema'
import { PinterestPublishProvider } from './pinterest-publish.provider'

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
  const pinterestService = {
    createPin: vi.fn(),
    getPin: vi.fn(),
    deletePin: vi.fn(),
    updatePin: vi.fn(),
    createVideoMediaUpload: vi.fn(),
    uploadVideoMedia: vi.fn(),
    getMediaStatus: vi.fn(),
  }
  const mediaService = { getBuffer: vi.fn() }
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
})
