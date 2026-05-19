import type { QueueService } from '@yikart/aitoearn-queue'
import type { AssetsService, StorageProvider } from '@yikart/assets'
import type { CreditsHelperService } from '@yikart/helpers'
import type { AiLogRepository, AiLogSettlementStatus, AiLogStatus } from '@yikart/mongodb'
import type { AiAvailabilityService } from '../../../ai-availability/ai-availability.service'
import type { ModelsConfigService } from '../../models-config'
import type { AsyncSettlementService } from '../../settlement'
import { BadRequestException } from '@nestjs/common'
import { AiLogSettlementBillingMode } from '@yikart/aitoearn-ai-shared'
import { UserType } from '@yikart/common'
import { AiLogChannel } from '@yikart/mongodb'
import { vi } from 'vitest'
import { ContentType, VolcengineException, VolcengineService as VolcengineLibService, TaskStatus as VolcTaskStatus } from '../../libs/volcengine'
import { VolcengineVideoService } from './volcengine.service'

describe('volcengineVideoService', () => {
  let service: VolcengineVideoService
  let mockVolcengineLibService: vi.Mocked<VolcengineLibService>
  let mockAiLogRepo: vi.Mocked<AiLogRepository>
  let mockAssetsService: vi.Mocked<AssetsService>
  let mockStorageProvider: vi.Mocked<Pick<StorageProvider, 'parsePathFromUrl' | 'toPresignedUrl'>>
  let mockAiAvailability: vi.Mocked<Pick<AiAvailabilityService, 'executeAsync' | 'recordAsyncComplete'>>
  let mockAsyncSettlementService: vi.Mocked<Pick<AsyncSettlementService, 'createPendingSettlement' | 'getPrepaidPoints' | 'settleSuccess'>>
  let mockCreditsHelper: vi.Mocked<Pick<CreditsHelperService, 'getBalance' | 'deductCredits'>>
  let mockModelsConfigService: ModelsConfigService

  beforeEach(() => {
    mockVolcengineLibService = {
      createVideoGenerationTask: vi.fn(),
    } as unknown as vi.Mocked<VolcengineLibService>

    mockAiLogRepo = {
      getByTaskId: vi.fn(),
      updateById: vi.fn(),
      create: vi.fn(),
    } as unknown as vi.Mocked<AiLogRepository>

    mockAssetsService = {
      uploadFromUrl: vi.fn(),
    } as unknown as vi.Mocked<AssetsService>

    mockStorageProvider = {
      parsePathFromUrl: vi.fn((url: string) => url),
      toPresignedUrl: vi.fn(async (url: string) => url),
    }

    mockAiAvailability = {
      executeAsync: vi.fn(),
      recordAsyncComplete: vi.fn(),
    }

    mockAsyncSettlementService = {
      createPendingSettlement: vi.fn(),
      getPrepaidPoints: vi.fn(),
      settleSuccess: vi.fn(),
    }

    mockCreditsHelper = {
      getBalance: vi.fn(),
      deductCredits: vi.fn(),
    }

    mockModelsConfigService = {
      config: {
        video: {
          generation: [
            {
              name: 'doubao-seedance-2-0-pro',
              pricing: [
                {
                  price: 42,
                },
              ],
              settlement: {
                withoutVideo: '0.046',
                withVideo: '0.028',
              },
            },
            {
              name: 'doubao-seedance-1-0-legacy',
              pricing: [
                {
                  price: 24,
                },
              ],
            },
          ],
        },
      },
    } as ModelsConfigService

    service = new VolcengineVideoService(
      mockVolcengineLibService,
      mockAiLogRepo,
      mockAssetsService,
      mockStorageProvider as unknown as StorageProvider,
      mockModelsConfigService,
      mockCreditsHelper as unknown as CreditsHelperService,
      {} as QueueService,
      mockAiAvailability as unknown as AiAvailabilityService,
      mockAsyncSettlementService as unknown as AsyncSettlementService,
    )
  })

  function createAiLog(overrides?: Partial<{
    channel: AiLogChannel
    model: string
    points: number
    request: Record<string, unknown>
    settlement: { status: AiLogSettlementStatus, prepaidPoints: number }
    status: AiLogStatus
  }>) {
    return {
      id: 'ai-log-1',
      userId: 'user-1',
      userType: UserType.User,
      taskId: 'provider-task-1',
      model: 'doubao-seedance-2-0-pro',
      channel: AiLogChannel.Volcengine,
      startedAt: new Date('2026-04-07T10:00:00.000Z'),
      request: {
        content: [
          {
            type: ContentType.Text,
            text: 'generate a video',
          },
        ],
      },
      points: 42,
      settlement: {
        status: 'pending' as AiLogSettlementStatus,
        prepaidPoints: 42,
      },
      status: 'generating' as AiLogStatus,
      ...overrides,
    }
  }

  it('rejects requests without any text prompt', async () => {
    await expect(service.create({
      userId: 'user-1',
      userType: UserType.User,
      model: 'doubao-seedance-2-0-pro',
      content: [
        {
          type: ContentType.ImageUrl,
          image_url: { url: 'https://example.com/first-frame.png' },
        },
      ],
    })).rejects.toThrow(BadRequestException)

    expect(mockAiAvailability.executeAsync).not.toHaveBeenCalled()
  })

  it('rejects requests whose text content resolves to an empty prompt', async () => {
    await expect(service.create({
      userId: 'user-1',
      userType: UserType.User,
      model: 'doubao-seedance-2-0-pro',
      content: [
        {
          type: ContentType.Text,
          text: ' --ratio 16:9',
        },
      ],
    })).rejects.toThrow(BadRequestException)

    expect(mockAiAvailability.executeAsync).not.toHaveBeenCalled()
  })

  it('throws volcengine exception directly when provider rejects task creation', async () => {
    mockCreditsHelper.getBalance.mockResolvedValue(100 as never)
    mockAiAvailability.executeAsync.mockImplementation(async (_context, executor) => await executor())
    mockVolcengineLibService.createVideoGenerationTask.mockRejectedValue(
      new VolcengineException({
        operation: 'POST /api/v3/contents/generations/tasks',
        httpStatus: 400,
        providerCode: 'InputImageSensitiveContentDetected.PrivacyInformation',
        providerMessage: 'The request failed because the input image may contain real person. Request id: req-1',
        providerType: 'BadRequest',
        requestId: 'req-1',
      }),
    )

    let caughtError: unknown
    try {
      await service.create({
        userId: 'user-1',
        userType: UserType.User,
        model: 'doubao-seedance-2-0-pro',
        content: [
          {
            type: ContentType.Text,
            text: 'generate a video',
          },
        ],
      })
    }
    catch (error) {
      caughtError = error
    }

    expect(caughtError).toBeInstanceOf(VolcengineException)
    expect(caughtError).toMatchObject({
      message: 'The request failed because the input image may contain real person. (Request ID: req-1)',
      providerCode: 'InputImageSensitiveContentDetected.PrivacyInformation',
      providerType: 'BadRequest',
      requestId: 'req-1',
    })

    expect(mockCreditsHelper.deductCredits).not.toHaveBeenCalled()
    expect(mockAiLogRepo.create).not.toHaveBeenCalled()
  })

  it('settles successful callbacks without usage.total_tokens by falling back to prepaid points', async () => {
    mockAiLogRepo.getByTaskId.mockResolvedValue(createAiLog() as never)
    mockAsyncSettlementService.getPrepaidPoints.mockReturnValue(42)
    mockAssetsService.uploadFromUrl
      .mockResolvedValueOnce({ asset: { path: 'assets/last-frame.png' } } as never)
      .mockResolvedValueOnce({ asset: { path: 'assets/video.mp4' } } as never)
    mockAiLogRepo.updateById.mockResolvedValue({} as never)

    const callbackData = {
      id: 'provider-task-1',
      model: 'doubao-seedance-2-0-pro',
      status: VolcTaskStatus.Succeeded,
      created_at: 1,
      updated_at: 1_744_020_800,
      content: {
        video_url: 'https://example.com/video.mp4',
        last_frame_url: 'https://example.com/last-frame.png',
      },
    }

    await expect(service.callback(callbackData as never)).resolves.toBeUndefined()

    expect(mockAsyncSettlementService.settleSuccess).toHaveBeenCalledWith(
      'ai-log-1',
      42,
      expect.objectContaining({
        billingMode: AiLogSettlementBillingMode.Token,
        hasVideoInput: false,
        usageMissing: true,
      }),
    )

    const settlementMetadata = mockAsyncSettlementService.settleSuccess.mock.calls[0][2]
    expect(settlementMetadata?.totalTokens).toBeUndefined()
    expect(settlementMetadata?.tokenPrice).toBeUndefined()

    expect(mockAiLogRepo.updateById).toHaveBeenCalledWith(
      'ai-log-1',
      expect.objectContaining({
        status: 'success',
        response: callbackData,
      }),
    )
    expect(callbackData.content.video_url).toBe('assets/video.mp4')
    expect(callbackData.content.last_frame_url).toBe('assets/last-frame.png')
    expect(mockAiAvailability.recordAsyncComplete).toHaveBeenCalledTimes(1)
  })

  it('falls back to prepaid points when usage.total_tokens is zero', async () => {
    mockAiLogRepo.getByTaskId.mockResolvedValue(createAiLog() as never)
    mockAsyncSettlementService.getPrepaidPoints.mockReturnValue(42)
    mockAiLogRepo.updateById.mockResolvedValue({} as never)

    await expect(service.callback({
      id: 'provider-task-1',
      model: 'doubao-seedance-2-0-pro',
      status: VolcTaskStatus.Succeeded,
      created_at: 1,
      updated_at: 1_744_020_800,
      usage: {
        completion_tokens: 0,
        total_tokens: 0,
      },
    } as never)).resolves.toBeUndefined()

    expect(mockAsyncSettlementService.settleSuccess).toHaveBeenCalledWith(
      'ai-log-1',
      42,
      expect.objectContaining({
        billingMode: AiLogSettlementBillingMode.Token,
        usageMissing: true,
        totalTokens: undefined,
      }),
    )
  })

  it('falls back to prepaid points for fixed-pricing models even when usage.total_tokens is present', async () => {
    mockAiLogRepo.getByTaskId.mockResolvedValue(createAiLog({
      model: 'doubao-seedance-1-0-legacy',
      points: 30,
      settlement: {
        status: 'pending' as AiLogSettlementStatus,
        prepaidPoints: 30,
      },
    }) as never)
    mockAsyncSettlementService.getPrepaidPoints.mockReturnValue(30)
    mockAiLogRepo.updateById.mockResolvedValue({} as never)

    await expect(service.callback({
      id: 'provider-task-1',
      model: 'doubao-seedance-1-0-legacy',
      status: VolcTaskStatus.Succeeded,
      created_at: 1,
      updated_at: 1_744_020_800,
      usage: {
        completion_tokens: 100,
        total_tokens: 200,
      },
    } as never)).resolves.toBeUndefined()

    expect(mockAsyncSettlementService.settleSuccess).toHaveBeenCalledWith(
      'ai-log-1',
      30,
      expect.objectContaining({
        billingMode: AiLogSettlementBillingMode.Fixed,
        usageMissing: false,
        totalTokens: undefined,
        tokenPrice: undefined,
      }),
    )
  })

  it('merges inline params from later text blocks into the provider request', async () => {
    vi.spyOn(service as never, 'calculatePrice').mockResolvedValue(42)
    mockCreditsHelper.getBalance.mockResolvedValue(100)
    mockCreditsHelper.deductCredits.mockResolvedValue(undefined)
    mockVolcengineLibService.createVideoGenerationTask.mockResolvedValue({ id: 'provider-task-1' } as never)
    mockAiAvailability.executeAsync.mockImplementation(async (_context, run) => await run())
    mockAsyncSettlementService.createPendingSettlement.mockReturnValue({
      status: 'pending',
      prepaidPoints: 42,
    } as never)
    mockAiLogRepo.create.mockResolvedValue({ id: 'ai-log-1' } as never)

    await expect(service.create({
      userId: 'user-1',
      userType: UserType.User,
      model: 'doubao-seedance-2-0-pro',
      content: [
        {
          type: ContentType.Text,
          text: 'generate a video',
        },
        {
          type: ContentType.Text,
          text: 'details --rt 16:9 --dur 10 --seed 7 --wm false',
        },
      ],
    })).resolves.toEqual(expect.objectContaining({
      id: 'ai-log-1',
      points: 42,
    }))

    expect(mockVolcengineLibService.createVideoGenerationTask).toHaveBeenCalledWith(
      expect.objectContaining({
        ratio: '16:9',
        duration: 10,
        seed: 7,
        watermark: false,
      }),
    )
  })

  it('uses a failed default error message when provider error is missing', async () => {
    mockAiLogRepo.getByTaskId.mockResolvedValue(createAiLog() as never)
    mockAiLogRepo.updateById.mockResolvedValue({} as never)
    mockAiAvailability.recordAsyncComplete.mockResolvedValue(undefined)
    vi.spyOn(service as never, 'enqueueTaskRefund').mockResolvedValue(undefined)

    await expect(service.callback({
      id: 'provider-task-1',
      model: 'doubao-seedance-2-0-pro',
      status: VolcTaskStatus.Failed,
      created_at: 1,
      updated_at: 1_744_020_800,
      error: null,
    } as never)).resolves.toBeUndefined()

    expect(mockAiLogRepo.updateById).toHaveBeenCalledWith(
      'ai-log-1',
      expect.objectContaining({
        errorMessage: 'Volcengine task failed',
        status: 'failed',
      }),
    )
    expect(mockAiAvailability.recordAsyncComplete).toHaveBeenCalledWith(
      'provider-task-1',
      expect.any(Object),
      expect.objectContaining({
        success: false,
        errorMessage: 'Volcengine task failed',
      }),
    )
  })

  it('keeps expired default error message distinct from failed', async () => {
    mockAiLogRepo.getByTaskId.mockResolvedValue(createAiLog() as never)
    mockAiLogRepo.updateById.mockResolvedValue({} as never)
    mockAiAvailability.recordAsyncComplete.mockResolvedValue(undefined)
    vi.spyOn(service as never, 'enqueueTaskRefund').mockResolvedValue(undefined)

    await expect(service.callback({
      id: 'provider-task-1',
      model: 'doubao-seedance-2-0-pro',
      status: VolcTaskStatus.Expired,
      created_at: 1,
      updated_at: 1_744_020_800,
      error: null,
    } as never)).resolves.toBeUndefined()

    expect(mockAiLogRepo.updateById).toHaveBeenCalledWith(
      'ai-log-1',
      expect.objectContaining({
        errorMessage: 'Volcengine task expired',
        status: 'failed',
      }),
    )
  })

  it('ignores terminal callbacks after the log has already left generating state', async () => {
    mockAiLogRepo.getByTaskId.mockResolvedValue(createAiLog({
      status: 'success' as AiLogStatus,
    }) as never)

    await expect(service.callback({
      id: 'provider-task-1',
      model: 'doubao-seedance-2-0-pro',
      status: VolcTaskStatus.Succeeded,
      created_at: 1,
      updated_at: 1_744_020_800,
      content: {
        video_url: 'https://example.com/video.mp4',
      },
      usage: {
        completion_tokens: 100,
        total_tokens: 200,
      },
    } as never)).resolves.toBeUndefined()

    expect(mockAssetsService.uploadFromUrl).not.toHaveBeenCalled()
    expect(mockAiLogRepo.updateById).not.toHaveBeenCalled()
    expect(mockAsyncSettlementService.settleSuccess).not.toHaveBeenCalled()
    expect(mockAiAvailability.recordAsyncComplete).not.toHaveBeenCalled()
  })
})
