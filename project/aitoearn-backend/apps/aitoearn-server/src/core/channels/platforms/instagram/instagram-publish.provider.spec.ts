import type { PublishPublishInput, PublishValidateInput, PublishVerifyInput } from '../platforms.interface'
import type { InstagramOption } from './instagram.schema'
import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory, PlatformErrorCauseType } from '../platforms.exception'
import { InstagramPublishProvider } from './instagram-publish.provider'
import { InstagramPlatformException } from './instagram.exception'
import { InstagramMediaType } from './instagram.schema'
import { InstagramService } from './instagram.service'

function createInput(mediaUrl: string, option?: InstagramOption): PublishPublishInput<InstagramOption> {
  return {
    taskId: 'task-1',
    platform: AccountType.Instagram,
    accountId: 'account-1',
    content: {
      body: 'caption',
      media: [{ url: mediaUrl }],
    },
    option,
    credential: {
      accessToken: 'access-token',
      platformUid: 'ig-user-id',
    },
  }
}

function createProvider() {
  const instagramService = {
    createMediaContainer: vi.fn(),
    createCarouselContainer: vi.fn(),
    getMediaContainerStatus: vi.fn(async () => ({
      statusCode: 'FINISHED',
    })),
    publishContainer: vi.fn(async () => ({ id: 'media-1' })),
    getContentPublishingLimit: vi.fn(async () => ({
      quotaUsage: 50,
      quotaTotal: 50,
      quotaDuration: 86400,
    })),
    getMediaInfo: vi.fn(async () => ({
      id: 'media-1',
      mediaType: 'IMAGE',
      permalink: 'https://www.instagram.com/p/media-shortcode/',
    })),
    deleteMedia: vi.fn(),
  }

  return {
    provider: new InstagramPublishProvider(instagramService as unknown as InstagramService),
    instagramService,
  }
}

describe('instagram publish provider', () => {
  it('publishes a single image with the Graph media id and permalink', async () => {
    const { provider, instagramService } = createProvider()
    instagramService.createMediaContainer.mockResolvedValueOnce('container-1')

    await expect(provider.publish(createInput('https://assets.example.test/image.jpg'))).resolves.toEqual({
      status: 200,
      platformWorkId: 'media-1',
      permalink: 'https://www.instagram.com/p/media-shortcode/',
      dataOption: {
        containerId: 'container-1',
        mediaType: InstagramMediaType.Image,
      },
    })
    expect(instagramService.publishContainer).toHaveBeenCalledWith(
      'access-token',
      'ig-user-id',
      'container-1',
    )
  })

  it('publishes extensionless media as an image when metadata declares image', async () => {
    const { provider, instagramService } = createProvider()
    instagramService.createMediaContainer.mockResolvedValueOnce('container-1')

    await provider.publish({
      ...createInput('https://assets.example.test/signed-media'),
      content: {
        body: 'caption',
        media: [{ url: 'https://assets.example.test/signed-media', metadata: { type: 'image' } }],
      },
    })

    expect(instagramService.createMediaContainer).toHaveBeenCalledWith(
      'access-token',
      'ig-user-id',
      expect.objectContaining({
        imageUrl: 'https://assets.example.test/signed-media',
      }),
    )
  })

  it('keeps hashtags and mentions in the Instagram caption', async () => {
    const { provider, instagramService } = createProvider()
    instagramService.createMediaContainer.mockResolvedValueOnce('container-1')

    await provider.publish({
      ...createInput('https://assets.example.test/image.jpg'),
      content: {
        body: 'caption #topic @natgeo',
        media: [{ url: 'https://assets.example.test/image.jpg' }],
      },
    })

    expect(instagramService.createMediaContainer).toHaveBeenCalledWith(
      'access-token',
      'ig-user-id',
      expect.objectContaining({
        caption: 'caption #topic @natgeo',
      }),
    )
  })

  it('validates Instagram hashtag and mention limits from caption body', async () => {
    const { provider } = createProvider()
    const input: PublishValidateInput = {
      platform: AccountType.Instagram,
      accountId: 'account-1',
      content: {
        body: [
          ...Array.from({ length: 31 }, (_, i) => `#tag${i}`),
          ...Array.from({ length: 21 }, (_, i) => `@user${i}`),
        ].join(' '),
        media: [{ url: 'https://assets.example.test/image.jpg' }],
      },
    }

    await expect(provider.validate(input)).resolves.toMatchObject({
      valid: false,
      issues: [
        expect.objectContaining({
          code: 'too_big',
          path: ['content', 'topics'],
        }),
        expect.objectContaining({
          code: 'too_big',
          path: ['content', 'body'],
        }),
      ],
    })
  })

  it('publishes a carousel with child container ids only in dataOption', async () => {
    const { provider, instagramService } = createProvider()
    instagramService.createMediaContainer
      .mockResolvedValueOnce('child-container-1')
      .mockResolvedValueOnce('child-container-2')
    instagramService.createCarouselContainer.mockResolvedValueOnce('carousel-container-1')

    await expect(provider.publish({
      ...createInput('https://assets.example.test/first.jpg'),
      content: {
        body: 'caption',
        media: [
          { url: 'https://assets.example.test/first.jpg' },
          { url: 'https://assets.example.test/second.jpeg' },
        ],
      },
    })).resolves.toEqual({
      status: 200,
      platformWorkId: 'media-1',
      permalink: 'https://www.instagram.com/p/media-shortcode/',
      dataOption: {
        containerId: 'carousel-container-1',
        childContainerIds: ['child-container-1', 'child-container-2'],
        mediaType: InstagramMediaType.Carousel,
      },
    })
  })

  it('publishes a reel by media_type with the Graph media id and cover URL', async () => {
    const { provider, instagramService } = createProvider()
    instagramService.createMediaContainer.mockResolvedValueOnce('reel-container-1')

    await expect(provider.publish({
      ...createInput('https://assets.example.test/video.mp4', { media_type: InstagramMediaType.Reels }),
      content: {
        body: 'caption',
        media: [{ url: 'https://assets.example.test/video.mp4' }],
        cover: { url: 'https://assets.example.test/reel-cover.jpg' },
      },
    })).resolves.toEqual({
      status: 200,
      platformWorkId: 'media-1',
      permalink: 'https://www.instagram.com/p/media-shortcode/',
      dataOption: {
        containerId: 'reel-container-1',
        mediaType: InstagramMediaType.Reels,
      },
    })
    expect(instagramService.createMediaContainer).toHaveBeenCalledWith(
      'access-token',
      'ig-user-id',
      expect.objectContaining({
        videoUrl: 'https://assets.example.test/video.mp4',
        coverUrl: 'https://assets.example.test/reel-cover.jpg',
        mediaType: InstagramMediaType.Reels,
      }),
    )
  })

  it('defaults single video publishing to reels', async () => {
    const { provider, instagramService } = createProvider()
    instagramService.createMediaContainer.mockResolvedValueOnce('reel-container-1')

    await expect(provider.publish(createInput('https://assets.example.test/video.mp4'))).resolves.toMatchObject({
      dataOption: {
        containerId: 'reel-container-1',
        mediaType: InstagramMediaType.Reels,
      },
    })
    expect(instagramService.createMediaContainer).toHaveBeenCalledWith(
      'access-token',
      'ig-user-id',
      expect.objectContaining({
        videoUrl: 'https://assets.example.test/video.mp4',
        mediaType: InstagramMediaType.Reels,
      }),
    )
  })

  it('converts Instagram content publishing limit errors into local task messages', async () => {
    const { provider, instagramService } = createProvider()
    instagramService.createMediaContainer.mockRejectedValueOnce(new InstagramPlatformException({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: PlatformErrorCategory.Quota,
      cause: {
        type: PlatformErrorCauseType.Platform,
        httpStatus: 400,
        platformCode: 9,
        platformMessage: undefined,
        raw: {
          error: {
            message: 'User is performing too many actions',
            type: 'OAuthException',
            code: 9,
            error_subcode: 2207069,
            fbtrace_id: 'trace-id',
          },
        },
      },
      retryable: false,
    }))

    let thrown: unknown
    try {
      await provider.publish(createInput('https://assets.example.test/video.mp4'))
    }
    catch (err) {
      thrown = err
    }

    expect(instagramService.getContentPublishingLimit).toHaveBeenCalledWith('access-token', 'ig-user-id')
    expect(thrown).toBeInstanceOf(InstagramPlatformException)
    const failure = (thrown as InstagramPlatformException).toTaskFailure()
    expect(failure).toMatchObject({
      category: PlatformErrorCategory.Quota,
      message: undefined,
      retryable: false,
      originalData: {
        raw: {
          error: {
            message: 'User is performing too many actions',
            type: 'OAuthException',
            code: 9,
            error_subcode: 2207069,
            fbtrace_id: 'trace-id',
          },
        },
        quota: {
          usage: 50,
          total: 50,
          durationSeconds: 86400,
          fbtraceId: 'trace-id',
        },
      },
    })
  })

  it('publishes image and video stories by media_type', async () => {
    const { provider, instagramService } = createProvider()
    instagramService.createMediaContainer
      .mockResolvedValueOnce('image-story-container')
      .mockResolvedValueOnce('video-story-container')

    await expect(provider.publish(createInput('https://assets.example.test/story.jpg', { media_type: InstagramMediaType.Stories }))).resolves.toMatchObject({
      dataOption: {
        containerId: 'image-story-container',
        mediaType: InstagramMediaType.Stories,
      },
    })
    await expect(provider.publish(createInput('https://assets.example.test/story.mp4', { media_type: InstagramMediaType.Stories }))).resolves.toMatchObject({
      dataOption: {
        containerId: 'video-story-container',
        mediaType: InstagramMediaType.Stories,
      },
    })

    expect(instagramService.createMediaContainer).toHaveBeenNthCalledWith(
      1,
      'access-token',
      'ig-user-id',
      expect.objectContaining({
        imageUrl: 'https://assets.example.test/story.jpg',
        mediaType: InstagramMediaType.Stories,
      }),
    )
    expect(instagramService.createMediaContainer).toHaveBeenNthCalledWith(
      2,
      'access-token',
      'ig-user-id',
      expect.objectContaining({
        videoUrl: 'https://assets.example.test/story.mp4',
        mediaType: InstagramMediaType.Stories,
      }),
    )
  })

  it('resolves media_type specific media rules', () => {
    const { provider } = createProvider()

    expect(provider.resolveMediaRules({
      platform: AccountType.Instagram,
      accountId: 'account-1',
      content: {
        media: [{ url: 'https://assets.example.test/image.jpg' }],
      },
      option: { media_type: InstagramMediaType.Image },
    })).toMatchObject({
      aspectRatio: { min: 0.8, max: 1.91 },
    })

    expect(provider.resolveMediaRules({
      platform: AccountType.Instagram,
      accountId: 'account-1',
      content: {
        media: [{ url: 'https://assets.example.test/reel.mp4' }],
        cover: { url: 'https://assets.example.test/reel-cover.jpg' },
      },
      option: { media_type: InstagramMediaType.Reels },
    })).not.toHaveProperty('aspectRatio')

    expect(provider.resolveMediaRules({
      platform: AccountType.Instagram,
      accountId: 'account-1',
      content: {
        media: [{ url: 'https://assets.example.test/story.jpg' }],
      },
      option: { media_type: InstagramMediaType.Stories },
    })).toMatchObject({
      maxVideoDuration: 60,
    })
  })

  it('validates media_type specific media counts', async () => {
    const { provider } = createProvider()

    await expect(provider.validate({
      platform: AccountType.Instagram,
      accountId: 'account-1',
      content: {
        media: [{ url: 'https://assets.example.test/first.jpg' }],
      },
      option: { media_type: InstagramMediaType.Carousel },
    })).resolves.toMatchObject({
      valid: false,
      issues: [expect.objectContaining({
        code: 'too_small',
        path: ['content', 'media'],
      })],
    })

    await expect(provider.validate({
      platform: AccountType.Instagram,
      accountId: 'account-1',
      content: {
        media: [
          { url: 'https://assets.example.test/first.jpg' },
          { url: 'https://assets.example.test/second.jpg' },
        ],
      },
      option: { media_type: InstagramMediaType.Stories },
    })).resolves.toMatchObject({
      valid: false,
      issues: [expect.objectContaining({
        code: 'too_big',
        path: ['content', 'media'],
      })],
    })
  })

  it('does not publish when the final media permalink is missing', async () => {
    const { provider, instagramService } = createProvider()
    instagramService.createMediaContainer.mockResolvedValueOnce('container-1')
    instagramService.getMediaInfo.mockResolvedValueOnce({
      id: 'media-1',
      mediaType: 'IMAGE',
    })

    await expect(provider.publish(createInput('https://assets.example.test/image.jpg')))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelPlatformResponseInvalid })
  })

  it('does not verify as published when permalink is missing', async () => {
    const { provider, instagramService } = createProvider()
    instagramService.getMediaInfo.mockResolvedValueOnce({
      id: 'media-1',
      mediaType: 'IMAGE',
    })
    const input: PublishVerifyInput = {
      taskId: 'task-1',
      platform: AccountType.Instagram,
      platformWorkId: 'media-1',
      dataOption: { containerId: 'container-1', mediaType: InstagramMediaType.Image },
      credential: {
        accessToken: 'access-token',
      },
    }

    await expect(provider.verify?.(input)).resolves.toEqual({
      published: false,
      platformWorkId: 'media-1',
    })
  })
})
