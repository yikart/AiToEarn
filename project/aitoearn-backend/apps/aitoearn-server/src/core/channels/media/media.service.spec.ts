import type { InternalAxiosRequestConfig } from 'axios'
import { AccountType } from '@yikart/common'
import { AxiosError } from 'axios'
import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory } from '../platforms/platforms.exception'
import { PublishMediaAdaptationImageFormat } from '../platforms/publish-media-adaptation.schema'
import { PublishValidationIssueCode } from '../platforms/publish.schema'
import { MediaService } from './media.service'

const PUBLIC_MEDIA_URL = 'https://93.184.216.34/video.mp4'

vi.mock('@yikart/assets', () => ({
  AssetsService: class AssetsService {},
  VideoMetadataService: class VideoMetadataService {},
}))

vi.mock('@yikart/mongodb', () => ({
  AssetType: {
    PublishMedia: 'publishMedia',
  },
}))

function createService(assetsService = { uploadFromBuffer: vi.fn() }) {
  return new MediaService({} as never, assetsService as never)
}

function setHttpAdapter(service: MediaService, adapter: (config: InternalAxiosRequestConfig) => unknown) {
  const serviceWithHttp = service as unknown as { http: { defaults: { adapter: unknown } } }
  serviceWithHttp.http.defaults.adapter = adapter
}

describe('media service http downloads', () => {
  it('returns media downloads as Buffer', async () => {
    const service = createService()
    setHttpAdapter(service, async config => ({
      data: Buffer.from('media-bytes'),
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }))

    const buffer = await service.getBuffer({
      platform: AccountType.TikTok,
      endpoint: 'downloadVideo',
      url: PUBLIC_MEDIA_URL,
    })

    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.toString()).toBe('media-bytes')
  })

  it('converts platform media download errors through the response interceptor', async () => {
    const service = createService()
    setHttpAdapter(service, async (config) => {
      throw new AxiosError('connect failed', 'ECONNRESET', config)
    })

    await expect(service.getBuffer({
      platform: AccountType.TikTok,
      endpoint: 'downloadVideo',
      url: PUBLIC_MEDIA_URL,
      taskId: 'task-id',
    })).rejects.toMatchObject({
      category: PlatformErrorCategory.Network,
      context: {
        endpoint: 'downloadVideo',
        taskId: 'task-id',
        metadata: { url: PUBLIC_MEDIA_URL },
      },
      platformCause: {
        platformMessage: 'connect failed',
      },
    })
  })

  it('keeps probe and conversion http errors unwrapped without platform context', async () => {
    const service = createService()
    const error = new AxiosError('probe failed', 'ECONNRESET')
    setHttpAdapter(service, async () => {
      throw error
    })

    await expect(service.probeImage('https://93.184.216.34/image.png')).rejects.toBe(error)
  })
})

describe('media service publish validation', () => {
  it('uses server metadata type for media probing and validates covers', async () => {
    const service = createService()
    const probeVideo = vi.spyOn(service, 'probeVideo').mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'mp4',
      durationSec: 30,
      codec: 'unknown',
      sizeBytes: 1024,
    })
    const probeImage = vi.spyOn(service, 'probeImage').mockResolvedValue({
      width: 1200,
      height: 900,
      format: 'jpeg',
      sizeBytes: 512,
    })

    await expect(service.validateMedia({
      media: [{
        url: 'https://93.184.216.34/media?id=video',
        metadata: { type: 'video' },
      }],
      cover: {
        url: 'https://93.184.216.34/cover.jpeg',
      },
    }, {
      videoFormats: ['mp4'],
      imageFormats: ['jpeg'],
    })).resolves.toEqual([])

    expect(probeVideo).toHaveBeenCalledWith('https://93.184.216.34/media?id=video')
    expect(probeImage).toHaveBeenCalledWith('https://93.184.216.34/cover.jpeg')
  })

  it('accepts extensionless video media normalized with metadata when probe format is unknown', async () => {
    const service = createService()
    vi.spyOn(service, 'probeVideo').mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'unknown',
      durationSec: 30,
      codec: 'unknown',
      sizeBytes: 1024,
    })

    await expect(service.validateMedia({
      media: [{
        url: 'https://93.184.216.34/signed-video',
        metadata: { type: 'video' },
      }],
    }, {
      videoFormats: ['mp4'],
      maxVideoDuration: 90,
    })).resolves.toEqual([])
  })

  it('keeps feed image aspect validation separate from reel and story cover rules', () => {
    const service = createService()
    const portraitImage = {
      width: 1080,
      height: 1920,
      format: 'jpeg',
      sizeBytes: 1024,
    }

    expect(service.validateImage(portraitImage, {
      imageFormats: ['jpeg'],
      aspectRatio: { min: 0.8, max: 1.91 },
    }, ['content', 'media', 0])).toEqual([expect.objectContaining({
      code: PublishValidationIssueCode.TooSmall,
      params: expect.objectContaining({
        current: 0.56,
        minimum: 0.8,
      }),
    })])

    expect(service.validateImage(portraitImage, {
      imageFormats: ['jpeg'],
    }, ['content', 'cover'])).toEqual([])
  })
})

describe('media service publish media preparation', () => {
  it('keeps media URLs unchanged and strips media adaptation options when adaptation is off', async () => {
    const assetsService = { uploadFromBuffer: vi.fn() }
    const service = createService(assetsService)
    vi.spyOn(service, 'probeImage').mockImplementation(async url => ({
      width: url.includes('cover') ? 1200 : 800,
      height: url.includes('cover') ? 900 : 600,
      format: 'png',
      sizeBytes: 512,
    }))
    const content = {
      media: [{
        url: 'https://cdn.example.test/source.png',
        options: { adaptation: { imageFormat: PublishMediaAdaptationImageFormat.Off } },
      }],
      cover: {
        url: 'https://cdn.example.test/cover.png',
        options: { adaptation: { imageFormat: PublishMediaAdaptationImageFormat.Off } },
      },
    }

    await expect(service.preparePublishContentMedia({
      userId: 'user-1',
      content,
      mediaRules: { imageFormats: ['jpg', 'jpeg', 'png'] },
    })).resolves.toEqual({
      content: {
        media: [{
          url: 'https://cdn.example.test/source.png',
          metadata: {
            type: 'image',
            width: 800,
            height: 600,
            format: 'png',
            sizeBytes: 512,
          },
        }],
        cover: {
          url: 'https://cdn.example.test/cover.png',
          metadata: {
            type: 'image',
            width: 1200,
            height: 900,
            format: 'png',
            sizeBytes: 512,
          },
        },
      },
      issues: [],
    })
    expect(assetsService.uploadFromBuffer).not.toHaveBeenCalled()
  })

  it('keeps auto media unchanged when the source format already matches platform rules', async () => {
    const assetsService = { uploadFromBuffer: vi.fn() }
    const service = createService(assetsService)
    vi.spyOn(service, 'probeImage').mockResolvedValue({
      width: 800,
      height: 600,
      format: 'jpeg',
      sizeBytes: 512,
    })

    await expect(service.preparePublishContentMedia({
      userId: 'user-1',
      content: {
        media: [{
          url: 'https://cdn.example.test/source.jpg',
          options: { adaptation: { imageFormat: PublishMediaAdaptationImageFormat.Auto } },
        }],
      },
      mediaRules: { imageFormats: ['jpg', 'jpeg', 'png'] },
    })).resolves.toEqual({
      content: {
        media: [{
          url: 'https://cdn.example.test/source.jpg',
          metadata: {
            type: 'image',
            width: 800,
            height: 600,
            format: 'jpeg',
            sizeBytes: 512,
          },
        }],
      },
      issues: [],
    })
    expect(assetsService.uploadFromBuffer).not.toHaveBeenCalled()
  })

  it('normalizes extensionless video media from backend probe metadata', async () => {
    const assetsService = { uploadFromBuffer: vi.fn() }
    const service = createService(assetsService)
    const probeVideo = vi.spyOn(service, 'probeVideo').mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'video/mp4',
      durationSec: 30,
      codec: 'unknown',
      sizeBytes: 1024,
    })
    setHttpAdapter(service, async config => ({
      data: undefined,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'video/mp4' },
      config,
    }))

    await expect(service.preparePublishContentMedia({
      userId: 'user-1',
      content: {
        media: [{ url: 'https://cdn.example.test/signed-media' }],
      },
      mediaRules: { videoFormats: ['mp4'] },
    })).resolves.toEqual({
      content: {
        media: [{
          url: 'https://cdn.example.test/signed-media',
          metadata: {
            type: 'video',
            width: 1920,
            height: 1080,
            durationSec: 30,
            codec: 'unknown',
            format: 'video/mp4',
            sizeBytes: 1024,
          },
        }],
      },
      issues: [],
    })
    expect(probeVideo).toHaveBeenCalledWith('https://cdn.example.test/signed-media')
    expect(assetsService.uploadFromBuffer).not.toHaveBeenCalled()
  })

  it('normalizes extensionless image media from backend probe metadata', async () => {
    const assetsService = { uploadFromBuffer: vi.fn() }
    const service = createService(assetsService)
    const source = await sharp({
      create: {
        width: 4,
        height: 2,
        channels: 3,
        background: '#ffffff',
      },
    }).png().toBuffer()
    setHttpAdapter(service, async config => ({
      data: config.method === 'head' ? undefined : source,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'image/png', 'content-length': String(source.length) },
      config,
    }))

    await expect(service.preparePublishContentMedia({
      userId: 'user-1',
      content: {
        media: [{ url: 'https://cdn.example.test/signed-image' }],
      },
      mediaRules: { imageFormats: ['png'] },
    })).resolves.toEqual({
      content: {
        media: [{
          url: 'https://cdn.example.test/signed-image',
          metadata: {
            type: 'image',
            width: 4,
            height: 2,
            format: 'png',
            sizeBytes: source.length,
          },
        }],
      },
      issues: [],
    })
    expect(assetsService.uploadFromBuffer).not.toHaveBeenCalled()
  })

  it('converts auto media to the first platform-supported target format when source format is unsupported', async () => {
    const source = await sharp({
      create: {
        width: 4,
        height: 2,
        channels: 3,
        background: '#ffffff',
      },
    }).png().toBuffer()
    const assetsService = {
      uploadFromBuffer: vi.fn(async () => ({
        url: 'https://assets.example.test/publish/media/source.jpeg',
      })),
    }
    const service = createService(assetsService)
    setHttpAdapter(service, async config => ({
      data: config.method === 'head' ? undefined : source,
      status: 200,
      statusText: 'OK',
      headers: { 'content-length': String(source.length) },
      config,
    }))

    const result = await service.preparePublishContentMedia({
      userId: 'user-1',
      content: {
        media: [{
          url: 'https://cdn.example.test/source.gif',
          options: { adaptation: { imageFormat: PublishMediaAdaptationImageFormat.Auto } },
        }],
      },
      mediaRules: { imageFormats: ['jpeg'], maxImageSize: 1024 * 1024 },
    })

    expect(result.issues).toEqual([])
    expect(result.content).toEqual({
      media: [{
        url: 'https://assets.example.test/publish/media/source.jpeg',
        metadata: {
          type: 'image',
          width: 4,
          height: 2,
          format: 'jpeg',
          sizeBytes: expect.any(Number),
        },
      }],
    })
    expect(assetsService.uploadFromBuffer).toHaveBeenCalledWith(
      'user-1',
      expect.any(Buffer),
      expect.objectContaining({
        type: 'publishMedia',
        mimeType: 'image/jpeg',
      }),
    )
  })

  it('rejects target image formats that are not allowed by platform media rules', async () => {
    const assetsService = { uploadFromBuffer: vi.fn() }
    const service = createService(assetsService)
    vi.spyOn(service, 'probeImage').mockResolvedValue({
      width: 800,
      height: 600,
      format: 'png',
      sizeBytes: 512,
    })
    const content = {
      media: [{
        url: 'https://cdn.example.test/source.png',
        options: { adaptation: { imageFormat: PublishMediaAdaptationImageFormat.Webp } },
      }],
    }

    const result = await service.preparePublishContentMedia({
      userId: 'user-1',
      content,
      mediaRules: { imageFormats: ['jpg', 'jpeg', 'png'] },
    })

    expect(result.content).toBe(content)
    expect(result.issues).toEqual([expect.objectContaining({
      code: PublishValidationIssueCode.InvalidOption,
      path: ['content', 'media', 0, 'options', 'adaptation', 'imageFormat'],
    })])
    expect(assetsService.uploadFromBuffer).not.toHaveBeenCalled()
  })

  it('converts publish images and reuses the uploaded asset for the same source URL', async () => {
    const source = await sharp({
      create: {
        width: 4,
        height: 2,
        channels: 3,
        background: '#ffffff',
      },
    }).png().toBuffer()
    const assetsService = {
      uploadFromBuffer: vi.fn(async () => ({
        url: 'https://assets.example.test/publish/media/source.jpeg',
      })),
    }
    const service = createService(assetsService)
    setHttpAdapter(service, async config => ({
      data: config.method === 'head' ? undefined : source,
      status: 200,
      statusText: 'OK',
      headers: { 'content-length': String(source.length) },
      config,
    }))

    const result = await service.preparePublishContentMedia({
      userId: 'user-1',
      content: {
        media: [{
          url: 'https://cdn.example.test/source.png',
          options: { adaptation: { imageFormat: PublishMediaAdaptationImageFormat.Jpeg } },
        }],
        cover: {
          url: 'https://cdn.example.test/source.png',
          options: { adaptation: { imageFormat: PublishMediaAdaptationImageFormat.Jpeg } },
        },
      },
      mediaRules: { imageFormats: ['jpg', 'jpeg'], maxImageSize: 1024 * 1024 },
    })

    expect(result.issues).toEqual([])
    expect(result.content).toEqual({
      media: [{
        url: 'https://assets.example.test/publish/media/source.jpeg',
        metadata: {
          type: 'image',
          width: 4,
          height: 2,
          format: 'jpeg',
          sizeBytes: expect.any(Number),
        },
      }],
      cover: {
        url: 'https://assets.example.test/publish/media/source.jpeg',
        metadata: {
          type: 'image',
          width: 4,
          height: 2,
          format: 'jpeg',
          sizeBytes: expect.any(Number),
        },
      },
    })
    expect(assetsService.uploadFromBuffer).toHaveBeenCalledTimes(1)
    expect(assetsService.uploadFromBuffer).toHaveBeenCalledWith(
      'user-1',
      expect.any(Buffer),
      expect.objectContaining({
        type: 'publishMedia',
        mimeType: 'image/jpeg',
        metadata: { width: 4, height: 2 },
      }),
    )
  })

  it('rejects oversized conversion sources before uploading them', async () => {
    const assetsService = { uploadFromBuffer: vi.fn() }
    const service = createService(assetsService)
    const source = await sharp({
      create: {
        width: 4,
        height: 2,
        channels: 3,
        background: '#ffffff',
      },
    }).png().toBuffer()
    setHttpAdapter(service, async config => ({
      data: config.method === 'head' ? undefined : source,
      status: 200,
      statusText: 'OK',
      headers: { 'content-length': String(26 * 1024 * 1024) },
      config,
    }))

    const result = await service.preparePublishContentMedia({
      userId: 'user-1',
      content: {
        media: [{
          url: 'https://cdn.example.test/source.png',
          options: { adaptation: { imageFormat: PublishMediaAdaptationImageFormat.Jpeg } },
        }],
      },
      mediaRules: { imageFormats: ['jpg', 'jpeg'] },
    })

    expect(result.issues).toEqual([expect.objectContaining({
      code: PublishValidationIssueCode.TooBig,
      path: ['content', 'media', 0],
    })])
    expect(assetsService.uploadFromBuffer).not.toHaveBeenCalled()
  })
})

describe('media service video validation', () => {
  it('accepts video formats configured as extensions when probe format is MIME', () => {
    const issues = createService().validateVideo({
      width: 1920,
      height: 1080,
      format: 'video/mp4',
      durationSec: 30,
      codec: 'unknown',
      sizeBytes: 1024,
    }, {
      videoFormats: ['mp4', 'mov'],
    }, ['content', 'media', 0])

    expect(issues).toEqual([])
  })

  it('reports unsupported video formats using normalized extension names', () => {
    const issues = createService().validateVideo({
      width: 1920,
      height: 1080,
      format: 'video/x-msvideo',
      durationSec: 30,
      codec: 'unknown',
      sizeBytes: 1024,
    }, {
      videoFormats: ['mp4', 'mov'],
    }, ['content', 'media', 0])

    expect(issues).toEqual([expect.objectContaining({
      code: PublishValidationIssueCode.UnsupportedFormat,
      params: expect.objectContaining({
        format: 'avi',
      }),
    })])
  })

  it('reports unknown video formats by default', () => {
    const issues = createService().validateVideo({
      width: 1920,
      height: 1080,
      format: 'unknown',
      durationSec: 30,
      codec: 'unknown',
      sizeBytes: 1024,
    }, {
      videoFormats: ['mp4', 'mov'],
    }, ['content', 'media', 0])

    expect(issues).toEqual([expect.objectContaining({
      code: PublishValidationIssueCode.UnsupportedFormat,
      params: expect.objectContaining({
        format: 'unknown',
      }),
    })])
  })

  it('reports video duration limits from media rules', () => {
    const service = createService()

    const tooShort = service.validateVideo({
      width: 1920,
      height: 1080,
      format: 'video/mp4',
      durationSec: 2,
      codec: 'unknown',
      sizeBytes: 1024,
    }, {
      videoFormats: ['mp4'],
      minVideoDuration: 3,
      maxVideoDuration: 90,
    }, ['content', 'media', 0])

    const tooLong = service.validateVideo({
      width: 1920,
      height: 1080,
      format: 'video/mp4',
      durationSec: 120,
      codec: 'unknown',
      sizeBytes: 1024,
    }, {
      videoFormats: ['mp4'],
      minVideoDuration: 3,
      maxVideoDuration: 90,
    }, ['content', 'media', 0])

    expect(tooShort).toEqual([expect.objectContaining({
      code: PublishValidationIssueCode.InvalidDuration,
      params: expect.objectContaining({ current: 2, minimum: 3, maximum: 90 }),
    })])
    expect(tooLong).toEqual([expect.objectContaining({
      code: PublishValidationIssueCode.InvalidDuration,
      params: expect.objectContaining({ current: 120, minimum: 3, maximum: 90 }),
    })])
  })
})
