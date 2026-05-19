import type { CreditsHelperService } from '@yikart/helpers'
import type { AiLogRepository } from '@yikart/mongodb'
import { AiLogSettlementRefundReason, AiLogSettlementSettledBy } from '@yikart/aitoearn-ai-shared'
import { CreditsConsumptionSource, CreditsType, UserType } from '@yikart/common'
import { AiLogSettlementStatus } from '@yikart/mongodb'
import { vi } from 'vitest'
import { AsyncSettlementService } from './settlement.service'

describe('asyncSettlementService', () => {
  let service: AsyncSettlementService
  let mockAiLogRepo: vi.Mocked<AiLogRepository>
  let mockCreditsHelper: vi.Mocked<CreditsHelperService>

  beforeEach(() => {
    mockAiLogRepo = {
      getById: vi.fn(),
      updateById: vi.fn(),
    } as unknown as vi.Mocked<AiLogRepository>

    mockCreditsHelper = {
      addCredits: vi.fn(),
      deductCredits: vi.fn(),
    } as unknown as vi.Mocked<CreditsHelperService>

    service = new AsyncSettlementService(
      mockAiLogRepo,
      mockCreditsHelper,
    )
  })

  it('refunds a failed task once and marks settlement as refunded', async () => {
    mockAiLogRepo.getById.mockResolvedValue({
      id: 'ai-log-1',
      userId: 'user-1',
      points: 100,
      settlement: {
        status: AiLogSettlementStatus.Pending,
        prepaidPoints: 100,
      },
    } as never)
    mockAiLogRepo.updateById.mockResolvedValue({} as never)

    await service.refundFailedTask('ai-log-1', {
      userId: 'user-1',
      amount: 100,
      description: 'seedance',
      expiredAt: null,
      metadata: {
        channel: 'volcengine',
      },
    })

    expect(mockCreditsHelper.addCredits).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      amount: 100,
      description: 'seedance',
      metadata: expect.objectContaining({
        channel: 'volcengine',
        taskId: 'ai-log-1',
        refundReason: AiLogSettlementRefundReason.AiTaskFailed,
      }),
      expiredAt: null,
    }))
    expect(mockAiLogRepo.updateById).toHaveBeenCalledWith(
      'ai-log-1',
      expect.objectContaining({
        $set: expect.objectContaining({
          points: 0,
          settlement: expect.objectContaining({
            status: AiLogSettlementStatus.Refunded,
            prepaidPoints: 100,
            actualPoints: 0,
            deltaPoints: -100,
            metadata: expect.objectContaining({
              amount: 100,
              channel: 'volcengine',
              refundReason: AiLogSettlementRefundReason.AiTaskFailed,
              settledBy: AiLogSettlementSettledBy.AiTaskRefundQueue,
            }),
          }),
        }),
      }),
    )
  })

  it('skips duplicate refund when settlement is already refunded', async () => {
    mockAiLogRepo.getById.mockResolvedValue({
      id: 'ai-log-1',
      settlement: {
        status: AiLogSettlementStatus.Refunded,
        prepaidPoints: 100,
      },
    } as never)

    await service.refundFailedTask('ai-log-1', {
      userId: 'user-1',
      amount: 100,
    })

    expect(mockCreditsHelper.addCredits).not.toHaveBeenCalled()
    expect(mockAiLogRepo.updateById).not.toHaveBeenCalled()
  })

  it('uses settlement metadata source when deducting async success delta', async () => {
    mockAiLogRepo.getById.mockResolvedValue({
      id: 'ai-log-1',
      userId: 'user-1',
      userType: UserType.User,
      model: 'video-model',
      channel: 'dashscope',
      points: 50,
      settlement: {
        status: AiLogSettlementStatus.Pending,
        prepaidPoints: 50,
        metadata: {
          source: CreditsConsumptionSource.AiDraftGeneration,
        },
      },
    } as never)
    mockAiLogRepo.updateById.mockResolvedValue({} as never)

    await service.settleSuccess('ai-log-1', 80)

    expect(mockCreditsHelper.deductCredits).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      amount: 30,
      type: CreditsType.AiService,
      source: CreditsConsumptionSource.AiDraftGeneration,
      description: 'video-model',
      metadata: expect.objectContaining({
        aiLogId: 'ai-log-1',
        source: CreditsConsumptionSource.AiDraftGeneration,
      }),
    }))
  })
})
