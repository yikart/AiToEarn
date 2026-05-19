import type { QueueService } from '@yikart/aitoearn-queue'
import type { AssetsService, StorageProvider, VideoMetadataService } from '@yikart/assets'
import type { CreditsHelperService } from '@yikart/helpers'
import type { AiLogRepository } from '@yikart/mongodb'
import { CreditsConsumptionSource, CreditsType, UserType } from '@yikart/common'
import { vi } from 'vitest'
import { config } from '../../../../config'
import { GrokVideoService } from './grok.service'

describe('grokVideoService.createVideo', () => {
  let service: GrokVideoService
  let mockGrokLibService: {
    editVideo: ReturnType<typeof vi.fn>
    createVideo: ReturnType<typeof vi.fn>
  }
  let mockAiLogRepo: {
    create: ReturnType<typeof vi.fn>
  }
  let mockCreditsHelper: {
    getBalance: ReturnType<typeof vi.fn>
    deductCredits: ReturnType<typeof vi.fn>
  }
  let mockVideoMetadataService: {
    probeVideoMetadata: ReturnType<typeof vi.fn>
  }
  let mockAiAvailability: {
    executeAsync: ReturnType<typeof vi.fn>
  }
  let mockAsyncSettlementService: {
    createPendingSettlement: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockGrokLibService = {
      editVideo: vi.fn().mockResolvedValue({ request_id: 'req-1' }),
      createVideo: vi.fn(),
    }
    mockAiLogRepo = {
      create: vi.fn().mockResolvedValue({ id: 'log-1' }),
    }
    mockCreditsHelper = {
      getBalance: vi.fn().mockResolvedValue(100),
      deductCredits: vi.fn().mockResolvedValue(undefined),
    }
    mockVideoMetadataService = {
      probeVideoMetadata: vi.fn(),
    }
    mockAiAvailability = {
      executeAsync: vi.fn().mockImplementation(async (_meta, execute) => execute()),
    }
    mockAsyncSettlementService = {
      createPendingSettlement: vi.fn().mockReturnValue({}),
    }

    service = new GrokVideoService(
      mockGrokLibService as never,
      mockAiLogRepo as unknown as AiLogRepository,
      {} as AssetsService,
      { parsePathFromUrl: vi.fn((url: string) => url), toPresignedUrl: vi.fn(async (url: string) => url) } as unknown as StorageProvider,
      { config: { video: { generation: config.ai.models.video.generation } } } as never,
      mockCreditsHelper as unknown as CreditsHelperService,
      {} as QueueService,
      mockVideoMetadataService as unknown as VideoMetadataService,
      mockAiAvailability as never,
      mockAsyncSettlementService as never,
    )
  })

  it('参考视频元数据时长无效时回退到请求时长计费', async () => {
    mockVideoMetadataService.probeVideoMetadata.mockResolvedValue({ duration: Number.NaN })

    const result = await service.createVideo({
      userId: 'user-1',
      userType: UserType.User,
      model: 'grok-imagine-video',
      prompt: 'edit video',
      duration: 5,
      videoUrl: 'https://example.com/reference.mp4',
    })

    expect(result).toEqual({
      id: 'log-1',
      requestId: 'req-1',
      points: 40,
    })
    expect(mockCreditsHelper.deductCredits).toHaveBeenCalledWith({
      userId: 'user-1',
      amount: 40,
      type: CreditsType.AiService,
      source: CreditsConsumptionSource.AiVideo,
      description: 'grok-imagine-video',
    })
  })

  it('参考视频元数据时长无效且未传 duration 时回退到模型默认时长计费', async () => {
    mockVideoMetadataService.probeVideoMetadata.mockResolvedValue({ duration: undefined })

    const result = await service.createVideo({
      userId: 'user-1',
      userType: UserType.User,
      model: 'grok-imagine-video',
      prompt: 'edit video',
      videoUrl: 'https://example.com/reference.mp4',
    })

    expect(result).toEqual({
      id: 'log-1',
      requestId: 'req-1',
      points: 64,
    })
    expect(mockCreditsHelper.deductCredits).toHaveBeenCalledWith({
      userId: 'user-1',
      amount: 64,
      type: CreditsType.AiService,
      source: CreditsConsumptionSource.AiVideo,
      description: 'grok-imagine-video',
    })
  })

  it('多张参考图时使用 reference_images 传给 Grok', async () => {
    mockGrokLibService.createVideo.mockResolvedValue({ request_id: 'req-1' })

    await service.createVideo({
      userId: 'user-1',
      userType: UserType.User,
      model: 'grok-imagine-video',
      prompt: 'reference to video',
      duration: 5,
      referenceImages: [
        'https://example.com/first.png',
        'https://example.com/second.png',
      ],
      aspectRatio: '16:9',
      resolution: '720p',
    })

    expect(mockGrokLibService.createVideo).toHaveBeenCalledWith({
      model: 'grok-imagine-video',
      prompt: 'reference to video',
      duration: 5,
      aspect_ratio: '16:9',
      resolution: '720p',
      image: undefined,
      reference_images: [
        { url: 'https://example.com/first.png' },
        { url: 'https://example.com/second.png' },
      ],
    })
    expect(mockAiLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      request: expect.objectContaining({
        referenceImages: [
          'https://example.com/first.png',
          'https://example.com/second.png',
        ],
      }),
    }))
  })

  it('单张图片时使用 image 传给 Grok', async () => {
    mockGrokLibService.createVideo.mockResolvedValue({ request_id: 'req-1' })

    await service.createVideo({
      userId: 'user-1',
      userType: UserType.User,
      model: 'grok-imagine-video',
      prompt: 'image to video',
      duration: 5,
      image: 'https://example.com/first.png',
    })

    expect(mockGrokLibService.createVideo).toHaveBeenCalledWith(expect.objectContaining({
      image: { url: 'https://example.com/first.png' },
      reference_images: undefined,
    }))
    expect(mockAiLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      request: expect.objectContaining({
        image: 'https://example.com/first.png',
      }),
    }))
  })
})
