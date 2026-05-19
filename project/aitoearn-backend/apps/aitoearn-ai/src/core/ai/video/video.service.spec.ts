import type { AssetsService, VideoMetadataService } from '@yikart/assets'
import type { AiLog, AiLogRepository, MaterialGroupRepository, MediaRepository, UserRepository } from '@yikart/mongodb'
import { FileUtil, ResponseCode, UserType } from '@yikart/common'
import { AiLogChannel, AiLogStatus, AiLogType, MediaType } from '@yikart/mongodb'
import { vi } from 'vitest'
import { TaskStatus } from '../../../common'
import { VideoService } from './video.service'

describe('videoService', () => {
  let service: VideoService
  let mockAiLogRepo: {
    updateById: ReturnType<typeof vi.fn>
    getById: ReturnType<typeof vi.fn>
  }
  let mockMaterialGroupRepository: {
    getInfo: ReturnType<typeof vi.fn>
  }
  let mockMediaRepository: {
    create: ReturnType<typeof vi.fn>
  }
  let mockAssetsService: {
    uploadFromBuffer: ReturnType<typeof vi.fn>
  }
  let mockVideoMetadataService: {
    extractThumbnailFromUrl: ReturnType<typeof vi.fn>
  }
  let mockGrokVideoService: {
    calculatePrice: ReturnType<typeof vi.fn>
    createFromRequest: ReturnType<typeof vi.fn>
    extractInput: ReturnType<typeof vi.fn>
    getTaskResult: ReturnType<typeof vi.fn>
  }
  let mockVolcengineVideoService: {
    calculatePrice: ReturnType<typeof vi.fn>
    createFromRequest: ReturnType<typeof vi.fn>
    extractInput: ReturnType<typeof vi.fn>
    getTaskResult: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    FileUtil.init({ endpoint: 'https://cdn.example.com' })

    const generationModels = [
      {
        name: 'grok-imagine-video',
        description: 'Grok Video',
        channel: 'grok',
        modes: ['text2video', 'image2video', 'video2video'],
        resolutions: ['720p'],
        durations: [5, 8],
        maxInputImages: 1,
        aspectRatios: ['9:16'],
        tags: [],
        defaults: {
          duration: 8,
          aspectRatio: '9:16',
        },
        pricing: [
          { duration: 5, price: 40 },
          { duration: 8, price: 64 },
          { mode: 'video2video', duration: 5, price: 40 },
          { mode: 'video2video', duration: 8, price: 64 },
        ],
      },
      {
        name: 'mode-fallback-model',
        description: 'Mode Fallback Model',
        channel: 'volcengine',
        modes: ['text2video', 'video2video'],
        resolutions: ['720p'],
        durations: [5],
        maxInputImages: 1,
        aspectRatios: ['9:16'],
        tags: [],
        defaults: {
          duration: 5,
          aspectRatio: '9:16',
          resolution: '720p',
        },
        pricing: [
          { resolution: '720p', duration: 5, price: 75 },
        ],
      },
    ]

    mockAiLogRepo = {
      updateById: vi.fn(),
      getById: vi.fn(),
    }
    mockMaterialGroupRepository = {
      getInfo: vi.fn(),
    }
    mockMediaRepository = {
      create: vi.fn(),
    }
    mockAssetsService = {
      uploadFromBuffer: vi.fn(),
    }
    mockVideoMetadataService = {
      extractThumbnailFromUrl: vi.fn(),
    }
    mockGrokVideoService = {
      calculatePrice: vi.fn().mockReturnValue(30),
      createFromRequest: vi.fn(),
      extractInput: vi.fn(),
      getTaskResult: vi.fn(),
    }
    mockVolcengineVideoService = {
      calculatePrice: vi.fn().mockResolvedValue(75),
      createFromRequest: vi.fn(),
      extractInput: vi.fn(),
      getTaskResult: vi.fn(),
    }

    service = new VideoService(
      {} as UserRepository,
      mockAiLogRepo as unknown as AiLogRepository,
      { config: { video: { generation: generationModels } } } as never,
      mockAssetsService as unknown as AssetsService,
      mockVideoMetadataService as unknown as VideoMetadataService,
      mockMaterialGroupRepository as unknown as MaterialGroupRepository,
      mockMediaRepository as unknown as MediaRepository,
      mockVolcengineVideoService as never,
      {} as never,
      mockGrokVideoService as never,
      {} as never,
      {} as never,
      {} as never,
    )
  })

  it('存在 mode 专属价格时优先使用精确匹配', async () => {
    const price = await service.calculateVideoGenerationPrice({
      model: 'grok-imagine-video',
      duration: 5,
      mode: 'video2video',
    })

    expect(price).toBe(30)
  })

  it('不存在 mode 专属价格时回退到默认价格', async () => {
    const price = await service.calculateVideoGenerationPrice({
      model: 'mode-fallback-model',
      duration: 5,
      resolution: '720p',
      mode: 'video2video',
    })

    expect(price).toBe(75)
  })

  it('groupId 非法时在提交阶段直接报错', async () => {
    mockMaterialGroupRepository.getInfo.mockResolvedValue(null)

    await expect(service.userVideoGeneration({
      userId: 'user-1',
      userType: UserType.User,
      model: 'grok-imagine-video',
      prompt: 'test prompt',
      groupId: 'group-1',
    })).rejects.toMatchObject({ code: ResponseCode.MaterialGroupNotFound })

    expect(mockGrokVideoService.createFromRequest).not.toHaveBeenCalled()
  })

  it('grok 渠道将请求分发给渠道服务', async () => {
    mockGrokVideoService.createFromRequest.mockResolvedValue({ id: 'task-1', points: 40 })

    const request = {
      userId: 'user-1',
      userType: UserType.User,
      model: 'grok-imagine-video',
      prompt: 'test prompt',
      image: ['https://example.com/1.png', 'https://example.com/2.png'],
      duration: 10,
      metadata: {
        aspectRatio: '16:9',
        resolution: '720p',
      },
    }

    const result = await service.userVideoGeneration(request)

    expect(mockGrokVideoService.createFromRequest).toHaveBeenCalledWith(request)
    expect(result).toEqual({
      id: 'task-1',
      status: TaskStatus.Submitted,
      points: 40,
    })
  })

  it('成功任务带 groupId 时会自动保存到素材并返回保存结果', async () => {
    mockGrokVideoService.extractInput.mockReturnValue({ prompt: 'test prompt' })
    mockGrokVideoService.getTaskResult.mockReturnValue({
      status: TaskStatus.Success,
      videoUrl: 'https://cdn.example.com/videos/generated.mp4',
    })
    mockVideoMetadataService.extractThumbnailFromUrl.mockResolvedValue(Buffer.from('thumb'))
    mockAssetsService.uploadFromBuffer.mockResolvedValue({ asset: { path: 'covers/generated.png' } })
    mockMediaRepository.create.mockResolvedValue({ id: 'media-1' })

    const aiLog = createAiLog({
      channel: AiLogChannel.Grok,
      request: { prompt: 'test prompt', groupId: 'group-1' },
      response: { status: 'done', videoUrl: 'videos/generated.mp4' },
    })

    const result = await service.transformToCommonResponse(aiLog)

    expect(mockVideoMetadataService.extractThumbnailFromUrl).toHaveBeenCalledWith(
      'https://cdn.example.com/videos/generated.mp4',
      2,
    )
    expect(mockMediaRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      userType: UserType.User,
      materialGroupId: 'group-1',
      type: MediaType.VIDEO,
      url: 'videos/generated.mp4',
      thumbUrl: 'covers/generated.png',
    })
    expect(mockAiLogRepo.updateById).toHaveBeenCalledWith('ai-1', {
      $set: {
        response: expect.objectContaining({
          status: 'done',
          videoUrl: 'videos/generated.mp4',
          mediaId: 'media-1',
          coverUrl: 'covers/generated.png',
          groupId: 'group-1',
        }),
      },
    })
    expect(result).toMatchObject({
      status: TaskStatus.Success,
      videoUrl: 'https://cdn.example.com/videos/generated.mp4',
      coverUrl: 'https://cdn.example.com/covers/generated.png',
      mediaId: 'media-1',
      groupId: 'group-1',
      input: {
        prompt: 'test prompt',
        groupId: 'group-1',
      },
    })
  })

  it('已有 mediaId 时不会重复创建素材', async () => {
    mockGrokVideoService.extractInput.mockReturnValue({ prompt: 'test prompt' })
    mockGrokVideoService.getTaskResult.mockReturnValue({
      status: TaskStatus.Success,
      videoUrl: 'https://cdn.example.com/videos/generated.mp4',
    })

    const aiLog = createAiLog({
      channel: AiLogChannel.Grok,
      request: { prompt: 'test prompt', groupId: 'group-1' },
      response: {
        status: 'done',
        videoUrl: 'videos/generated.mp4',
        mediaId: 'media-existing',
        coverUrl: 'covers/existing.png',
      },
    })

    const result = await service.transformToCommonResponse(aiLog)

    expect(mockMediaRepository.create).not.toHaveBeenCalled()
    expect(mockAiLogRepo.updateById).not.toHaveBeenCalled()
    expect(mockVideoMetadataService.extractThumbnailFromUrl).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      mediaId: 'media-existing',
      groupId: 'group-1',
      coverUrl: 'https://cdn.example.com/covers/existing.png',
    })
  })

  it('未传 groupId 时保持原行为，不创建素材', async () => {
    mockGrokVideoService.extractInput.mockReturnValue({ prompt: 'test prompt' })
    mockGrokVideoService.getTaskResult.mockReturnValue({
      status: TaskStatus.Success,
      videoUrl: 'https://cdn.example.com/videos/generated.mp4',
    })

    const aiLog = createAiLog({
      channel: AiLogChannel.Grok,
      request: { prompt: 'test prompt' },
      response: { status: 'done', videoUrl: 'videos/generated.mp4' },
    })

    const result = await service.transformToCommonResponse(aiLog)

    expect(mockMediaRepository.create).not.toHaveBeenCalled()
    expect(mockAiLogRepo.updateById).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      status: TaskStatus.Success,
      mediaId: undefined,
      groupId: undefined,
      coverUrl: undefined,
    })
  })

  it('仅有 request.groupId 但尚未保存时不会返回保存结果', async () => {
    const aiLog = createAiLog({
      status: AiLogStatus.Generating,
      request: { prompt: 'test prompt', groupId: 'group-1' },
      response: undefined,
    })

    const result = await service.transformToCommonResponse(aiLog)

    expect(result).toMatchObject({
      status: TaskStatus.InProgress,
      mediaId: undefined,
      groupId: undefined,
      coverUrl: undefined,
    })
  })

  it('volcengine 成功任务即使有 last_frame_url 也会统一截帧生成封面', async () => {
    mockVolcengineVideoService.extractInput.mockReturnValue({ prompt: 'test prompt' })
    mockVolcengineVideoService.getTaskResult.mockReturnValue({
      status: TaskStatus.Success,
      videoUrl: 'https://cdn.example.com/videos/generated.mp4',
    })
    mockVideoMetadataService.extractThumbnailFromUrl.mockResolvedValue(Buffer.from('thumb'))
    mockAssetsService.uploadFromBuffer.mockResolvedValue({ asset: { path: 'covers/generated-from-thumb.png' } })
    mockMediaRepository.create.mockResolvedValue({ id: 'media-2' })

    const aiLog = createAiLog({
      channel: AiLogChannel.Volcengine,
      request: { prompt: 'test prompt', groupId: 'group-1' },
      response: {
        status: 'succeeded',
        content: {
          video_url: 'videos/generated.mp4',
          last_frame_url: 'covers/from-provider.png',
        },
      },
    })

    const result = await service.transformToCommonResponse(aiLog)

    expect(mockVideoMetadataService.extractThumbnailFromUrl).toHaveBeenCalledWith(
      'https://cdn.example.com/videos/generated.mp4',
      2,
    )
    expect(mockAssetsService.uploadFromBuffer).toHaveBeenCalled()
    expect(mockMediaRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      userType: UserType.User,
      materialGroupId: 'group-1',
      type: MediaType.VIDEO,
      url: 'videos/generated.mp4',
      thumbUrl: 'covers/generated-from-thumb.png',
    })
    expect(result).toMatchObject({
      mediaId: 'media-2',
      coverUrl: 'https://cdn.example.com/covers/generated-from-thumb.png',
      groupId: 'group-1',
    })
  })
})

function createAiLog(overrides: Partial<AiLog>): AiLog {
  return {
    id: 'ai-1',
    userId: 'user-1',
    userType: UserType.User,
    type: AiLogType.Video,
    model: 'grok-imagine-video',
    channel: AiLogChannel.Grok,
    status: AiLogStatus.Success,
    startedAt: new Date('2025-01-01T00:00:00.000Z'),
    duration: 1000,
    request: {},
    response: {},
    points: 40,
    ...overrides,
  } as AiLog
}
