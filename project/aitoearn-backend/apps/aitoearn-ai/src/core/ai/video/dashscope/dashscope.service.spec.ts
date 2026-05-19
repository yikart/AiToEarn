import type { QueueService } from '@yikart/aitoearn-queue'
import type { AssetsService, StorageProvider, VideoMetadataService } from '@yikart/assets'
import type { CreditsHelperService } from '@yikart/helpers'
import type { AiLogRepository } from '@yikart/mongodb'
import type { AiAvailabilityService } from '../../../ai-availability/ai-availability.service'
import type { ModelsConfigService } from '../../models-config'
import type { AsyncSettlementService } from '../../settlement'
import { BadRequestException } from '@nestjs/common'
import { UserType } from '@yikart/common'
import { AiLogChannel, AiLogStatus, AiLogType, AssetType } from '@yikart/mongodb'
import { vi } from 'vitest'
import { DashscopeService as DashscopeLibService, DashscopeTaskStatus } from '../../libs/dashscope'
import { DashscopeVideoService } from './dashscope.service'

describe('dashscopeVideoService', () => {
  let service: DashscopeVideoService
  let mockDashscopeLibService: vi.Mocked<Pick<DashscopeLibService, 'createVideoTask'>>
  let mockAiLogRepo: vi.Mocked<Pick<AiLogRepository, 'create' | 'getByTaskId' | 'updateById'>>
  let mockAssetsService: vi.Mocked<Pick<AssetsService, 'uploadFromUrl'>>
  let mockStorageProvider: vi.Mocked<Pick<StorageProvider, 'parsePathFromUrl' | 'toPresignedUrl'>>
  let mockCreditsHelper: vi.Mocked<Pick<CreditsHelperService, 'getBalance' | 'deductCredits'>>
  let mockQueueService: vi.Mocked<Pick<QueueService, 'addAiTaskRefundJob'>>
  let mockVideoMetadataService: vi.Mocked<Pick<VideoMetadataService, 'probeVideoMetadata'>>
  let mockAiAvailability: vi.Mocked<Pick<AiAvailabilityService, 'executeAsync' | 'recordAsyncComplete'>>
  let mockAsyncSettlementService: vi.Mocked<Pick<AsyncSettlementService, 'createPendingSettlement' | 'markFailed' | 'settleSuccess'>>

  const generationModel = {
    name: 'happyhorse-1.0',
    channel: AiLogChannel.Dashscope,
    defaults: {
      resolution: '720P',
      aspectRatio: '9:16',
      duration: 5,
    },
    durations: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    maxInputImages: 9,
    pricing: [
      { resolution: '720P', duration: 5, price: 65 },
      { resolution: '720P', duration: 6, price: 78 },
      { resolution: '720P', duration: 15, price: 195 },
      { resolution: '1080P', duration: 5, price: 115 },
      { mode: 'video2video', resolution: '720P', duration: 5, price: 130 },
      { mode: 'video2video', resolution: '720P', duration: 15, price: 390 },
    ],
    modes: ['text2video', 'image2video', 'multi-image2video', 'video2video'],
    modeMappings: {
      'text2video': 'happyhorse-1.0-t2v',
      'image2video': 'happyhorse-1.0-i2v',
      'multi-image2video': 'happyhorse-1.0-r2v',
      'video2video': 'happyhorse-1.0-video-edit',
    },
  }

  beforeEach(() => {
    mockDashscopeLibService = {
      createVideoTask: vi.fn().mockResolvedValue({
        output: {
          task_id: 'provider-task-1',
          task_status: DashscopeTaskStatus.Pending,
        },
        request_id: 'request-1',
      }),
    }
    mockAiLogRepo = {
      create: vi.fn().mockResolvedValue({ id: 'ai-log-1' }),
      getByTaskId: vi.fn(),
      updateById: vi.fn().mockResolvedValue({} as never),
    }
    mockAssetsService = {
      uploadFromUrl: vi.fn().mockResolvedValue({ asset: { path: 'videos/generated.mp4' } }),
    }
    mockStorageProvider = {
      parsePathFromUrl: vi.fn((url: string) => url),
      toPresignedUrl: vi.fn(async (url: string) => `signed-${url}`),
    }
    mockCreditsHelper = {
      getBalance: vi.fn().mockResolvedValue(1000),
      deductCredits: vi.fn().mockResolvedValue(undefined),
    }
    mockQueueService = {
      addAiTaskRefundJob: vi.fn().mockResolvedValue(undefined),
    }
    mockVideoMetadataService = {
      probeVideoMetadata: vi.fn(),
    }
    mockAiAvailability = {
      executeAsync: vi.fn().mockImplementation(async (_context, execute) => execute()),
      recordAsyncComplete: vi.fn().mockResolvedValue(undefined),
    }
    mockAsyncSettlementService = {
      createPendingSettlement: vi.fn().mockReturnValue({ status: 'pending', prepaidPoints: 65 }),
      markFailed: vi.fn().mockResolvedValue(undefined),
      settleSuccess: vi.fn().mockResolvedValue(undefined),
    }

    service = new DashscopeVideoService(
      mockDashscopeLibService as unknown as DashscopeLibService,
      mockAiLogRepo as unknown as AiLogRepository,
      mockAssetsService as unknown as AssetsService,
      mockStorageProvider as unknown as StorageProvider,
      { config: { video: { generation: [generationModel] } } } as unknown as ModelsConfigService,
      mockCreditsHelper as unknown as CreditsHelperService,
      mockQueueService as unknown as QueueService,
      mockVideoMetadataService as unknown as VideoMetadataService,
      mockAiAvailability as unknown as AiAvailabilityService,
      mockAsyncSettlementService as unknown as AsyncSettlementService,
    )
  })

  it('uses modeMappings and passes resolution through unchanged', async () => {
    await service.createFromRequest({
      userId: 'user-1',
      userType: UserType.User,
      model: 'happyhorse-1.0',
      prompt: 'run',
      image: 'https://example.com/first.png',
      duration: 5,
      resolution: '720P',
    })

    expect(mockDashscopeLibService.createVideoTask).toHaveBeenCalledWith({
      model: 'happyhorse-1.0-i2v',
      input: {
        prompt: 'run',
        media: [{ type: 'first_frame', url: 'https://example.com/first.png' }],
      },
      parameters: {
        resolution: '720P',
        duration: 5,
        watermark: false,
      },
    })
    expect(mockAiLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      points: 65,
      request: expect.objectContaining({
        providerModel: 'happyhorse-1.0-i2v',
        resolution: '720P',
      }),
    }))
  })

  it('reads video duration for video2video and caps it at configured max duration', async () => {
    mockVideoMetadataService.probeVideoMetadata.mockResolvedValue({ duration: 17.2 } as never)

    await service.createFromRequest({
      userId: 'user-1',
      userType: UserType.User,
      model: 'happyhorse-1.0',
      prompt: 'edit',
      video_url: 'https://example.com/input.mp4',
      images: ['https://example.com/ref.png'],
      resolution: '720P',
    })

    expect(mockVideoMetadataService.probeVideoMetadata).toHaveBeenCalledWith('https://example.com/input.mp4')
    expect(mockDashscopeLibService.createVideoTask).toHaveBeenCalledWith(expect.objectContaining({
      model: 'happyhorse-1.0-video-edit',
      input: {
        prompt: 'edit',
        media: [
          { type: 'video', url: 'https://example.com/input.mp4' },
          { type: 'reference_image', url: 'https://example.com/ref.png' },
        ],
      },
      parameters: { resolution: '720P', watermark: false },
    }))
    expect(mockAiLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      points: 390,
      request: expect.objectContaining({ mode: 'video2video', duration: 15 }),
    }))
  })

  it('fails video2video when duration probing returns no usable duration', async () => {
    mockVideoMetadataService.probeVideoMetadata.mockResolvedValue({ duration: undefined } as never)

    await expect(service.createFromRequest({
      userId: 'user-1',
      userType: UserType.User,
      model: 'happyhorse-1.0',
      prompt: 'edit',
      video_url: 'https://example.com/input.mp4',
      resolution: '720P',
    })).rejects.toBeInstanceOf(BadRequestException)

    expect(mockDashscopeLibService.createVideoTask).not.toHaveBeenCalled()
  })

  it('settles success using only usage.duration and fixed config pricing', async () => {
    mockAiLogRepo.getByTaskId.mockResolvedValue(createDashscopeAiLog() as never)

    await service.callback({
      request_id: 'query-1',
      output: {
        task_id: 'provider-task-1',
        task_status: DashscopeTaskStatus.Succeeded,
        video_url: 'https://dashscope-result.example.com/video.mp4',
      },
      usage: { duration: 6 },
    })

    expect(mockAsyncSettlementService.settleSuccess).toHaveBeenCalledWith(
      'ai-log-1',
      78,
      expect.objectContaining({ channel: AiLogChannel.Dashscope }),
    )
    expect(mockAssetsService.uploadFromUrl).toHaveBeenCalledWith('user-1', {
      url: 'https://dashscope-result.example.com/video.mp4',
      type: AssetType.AiVideo,
    }, 'happyhorse-1.0')
  })

  it('settles video2video success by output duration and mode pricing', async () => {
    mockAiLogRepo.getByTaskId.mockResolvedValue(createDashscopeAiLog({
      points: 390,
      request: {
        providerModel: 'happyhorse-1.0-video-edit',
        mode: 'video2video',
        prompt: 'edit',
        resolution: '720P',
        duration: 15,
      },
      response: {
        providerModel: 'happyhorse-1.0-video-edit',
      },
    }) as never)

    await service.callback({
      request_id: 'query-1',
      output: {
        task_id: 'provider-task-1',
        task_status: DashscopeTaskStatus.Succeeded,
        video_url: 'https://dashscope-result.example.com/video.mp4',
      },
      usage: {
        duration: 30,
        input_video_duration: 15,
        output_video_duration: 15,
      },
    })

    expect(mockAsyncSettlementService.settleSuccess).toHaveBeenCalledWith(
      'ai-log-1',
      390,
      expect.objectContaining({ channel: AiLogChannel.Dashscope }),
    )
  })

  it('fails and refunds when video2video callback has no output duration', async () => {
    mockAiLogRepo.getByTaskId.mockResolvedValue(createDashscopeAiLog({
      request: {
        providerModel: 'happyhorse-1.0-video-edit',
        mode: 'video2video',
        prompt: 'edit',
        resolution: '720P',
        duration: 15,
      },
      response: {
        providerModel: 'happyhorse-1.0-video-edit',
      },
    }) as never)

    const result = await service.callback({
      request_id: 'query-1',
      output: {
        task_id: 'provider-task-1',
        task_status: DashscopeTaskStatus.Succeeded,
        video_url: 'https://dashscope-result.example.com/video.mp4',
      },
      usage: { duration: 30, input_video_duration: 15 },
    })

    expect(result).toEqual(expect.objectContaining({
      status: DashscopeTaskStatus.Failed,
      error: 'DashScope video edit output duration is required',
    }))
    expect(mockAsyncSettlementService.markFailed).toHaveBeenCalled()
    expect(mockQueueService.addAiTaskRefundJob).toHaveBeenCalled()
    expect(mockAsyncSettlementService.settleSuccess).not.toHaveBeenCalled()
  })

  it('fails and refunds when succeeded callback has no video url', async () => {
    mockAiLogRepo.getByTaskId.mockResolvedValue(createDashscopeAiLog() as never)

    const result = await service.callback({
      request_id: 'query-1',
      output: {
        task_id: 'provider-task-1',
        task_status: DashscopeTaskStatus.Succeeded,
      },
      usage: { duration: 5 },
    })

    expect(result).toEqual(expect.objectContaining({
      status: DashscopeTaskStatus.Failed,
      error: 'DashScope task succeeded but no video URL returned',
    }))
    expect(mockAiLogRepo.updateById).toHaveBeenCalledWith('ai-log-1', expect.objectContaining({
      status: AiLogStatus.Failed,
      response: expect.objectContaining({ status: DashscopeTaskStatus.Failed }),
    }))
    expect(mockAsyncSettlementService.markFailed).toHaveBeenCalled()
    expect(mockQueueService.addAiTaskRefundJob).toHaveBeenCalled()
    expect(mockAsyncSettlementService.settleSuccess).not.toHaveBeenCalled()
  })

  it('fails and refunds when succeeded callback has no usage.duration', async () => {
    mockAiLogRepo.getByTaskId.mockResolvedValue(createDashscopeAiLog() as never)

    const result = await service.callback({
      request_id: 'query-1',
      output: {
        task_id: 'provider-task-1',
        task_status: DashscopeTaskStatus.Succeeded,
        video_url: 'https://dashscope-result.example.com/video.mp4',
      },
      usage: {},
    })

    expect(result).toEqual(expect.objectContaining({
      status: DashscopeTaskStatus.Failed,
      error: 'DashScope usage.duration is required',
    }))
    expect(mockAiLogRepo.updateById).toHaveBeenCalledWith('ai-log-1', expect.objectContaining({
      status: AiLogStatus.Failed,
      errorMessage: 'DashScope usage.duration is required',
    }))
    expect(mockAsyncSettlementService.markFailed).toHaveBeenCalled()
    expect(mockQueueService.addAiTaskRefundJob).toHaveBeenCalled()
    expect(mockAsyncSettlementService.settleSuccess).not.toHaveBeenCalled()
  })
})

function createDashscopeAiLog(overrides: Partial<Record<string, unknown>> & { request?: Record<string, unknown>, response?: Record<string, unknown> } = {}) {
  const { request, response, points, ...rest } = overrides

  return {
    id: 'ai-log-1',
    userId: 'user-1',
    userType: UserType.User,
    taskId: 'provider-task-1',
    model: 'happyhorse-1.0',
    channel: AiLogChannel.Dashscope,
    type: AiLogType.Video,
    status: AiLogStatus.Generating,
    startedAt: new Date('2026-04-27T00:00:00.000Z'),
    points: points ?? 65,
    request: {
      model: 'happyhorse-1.0',
      providerModel: 'happyhorse-1.0-i2v',
      prompt: 'run',
      resolution: '720P',
      duration: 5,
      ...request,
    },
    response: {
      id: 'provider-task-1',
      status: DashscopeTaskStatus.Pending,
      providerModel: 'happyhorse-1.0-i2v',
      ...response,
    },
    ...rest,
  }
}
