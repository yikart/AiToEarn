import type { AiLogRepository } from '@yikart/mongodb'
import type { AsyncSettlementService } from '../settlement'
import type { ImageService } from './image.service'
import { CreditsType, UserType } from '@yikart/common'
import { AiLogStatus } from '@yikart/mongodb'
import { storage } from 'nestjs-pino/storage'
import { vi } from 'vitest'
import { ImageConsumer } from './image.consumer'

describe('imageConsumer', () => {
  let consumer: ImageConsumer
  let mockImageService: vi.Mocked<Pick<ImageService, 'generation' | 'edit' | 'qrCodeArt' | 'addUserCredits'>>
  let mockAiLogRepo: vi.Mocked<Pick<AiLogRepository, 'updateById'>>
  let mockAsyncSettlementService: vi.Mocked<Pick<AsyncSettlementService, 'markFailed' | 'refundFailedTask'>>

  beforeEach(() => {
    const mockLogger = {
      child: vi.fn(),
    }
    mockLogger.child.mockReturnValue(mockLogger)
    vi.spyOn(storage, 'getStore').mockReturnValue({
      logger: mockLogger,
    } as never)

    mockImageService = {
      generation: vi.fn(),
      edit: vi.fn(),
      qrCodeArt: vi.fn(),
      addUserCredits: vi.fn(),
    }

    mockAiLogRepo = {
      updateById: vi.fn(),
    }

    mockAsyncSettlementService = {
      markFailed: vi.fn(),
      refundFailedTask: vi.fn(),
    }

    consumer = new ImageConsumer(
      mockImageService as unknown as ImageService,
      mockAiLogRepo as unknown as AiLogRepository,
      mockAsyncSettlementService as unknown as AsyncSettlementService,
    )
  })

  it('uses refundFailedTask for user refunds to keep retries idempotent', async () => {
    const error = new Error('bad request')
    mockImageService.generation.mockRejectedValue(error)
    mockAiLogRepo.updateById.mockResolvedValue({} as never)
    mockAsyncSettlementService.refundFailedTask.mockResolvedValue({} as never)

    await expect(consumer.process({
      attemptsMade: 0,
      data: {
        logId: 'log-1',
        userId: 'user-1',
        userType: UserType.User,
        model: 'seedream-3',
        pricing: 12.5,
        request: { prompt: 'cat' },
        taskType: 'generation',
      },
      opts: {
        attempts: 3,
      },
    } as never)).rejects.toThrow('bad request')

    expect(mockAiLogRepo.updateById).toHaveBeenCalledWith(
      'log-1',
      expect.objectContaining({
        status: AiLogStatus.Failed,
        errorMessage: 'bad request',
      }),
    )
    expect(mockAsyncSettlementService.refundFailedTask).toHaveBeenCalledWith(
      'log-1',
      expect.objectContaining({
        userId: 'user-1',
        amount: 12.5,
        type: CreditsType.AiService,
        description: 'seedream-3',
        metadata: expect.objectContaining({
          taskType: 'generation',
          errorMessage: 'bad request',
          settledBy: 'image-async-consumer',
        }),
      }),
    )
    expect(mockAsyncSettlementService.markFailed).not.toHaveBeenCalled()
    expect(mockImageService.addUserCredits).not.toHaveBeenCalled()
  })
})
