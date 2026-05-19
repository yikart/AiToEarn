import type { AiLogSettlement, AiLogSettlementMetadata } from '@yikart/aitoearn-ai-shared'
import { Injectable, Logger } from '@nestjs/common'
import {
  AiLogSettlementRefundReason,
  AiLogSettlementSettledBy,
  AiLogSettlementType,
} from '@yikart/aitoearn-ai-shared'
import { CreditsType, UserType } from '@yikart/common'
import { CreditsHelperService } from '@yikart/helpers'
import { AiLog, AiLogRepository, AiLogSettlementStatus, Transactional } from '@yikart/mongodb'
import { BigNumber } from 'bignumber.js'

@Injectable()
export class AsyncSettlementService {
  private readonly logger = new Logger(AsyncSettlementService.name)

  constructor(
    private readonly aiLogRepo: AiLogRepository,
    private readonly creditsHelper: CreditsHelperService,
  ) {}

  createPendingSettlement(prepaidPoints: number, metadata?: AiLogSettlementMetadata): AiLogSettlement {
    return {
      status: AiLogSettlementStatus.Pending,
      prepaidPoints,
      metadata,
    }
  }

  getPrepaidPoints(aiLog: Pick<AiLog, 'points' | 'settlement'>): number {
    return aiLog.settlement?.prepaidPoints ?? aiLog.points ?? 0
  }

  @Transactional()
  async settleSuccess(aiLogId: string, actualPoints: number, metadata?: AiLogSettlementMetadata) {
    const aiLog = await this.aiLogRepo.getById(aiLogId)
    if (!aiLog) {
      this.logger.warn({ aiLogId }, 'Cannot settle async success: AiLog not found')
      return null
    }

    if (
      aiLog.settlement?.status === AiLogSettlementStatus.Settled
      || aiLog.settlement?.status === AiLogSettlementStatus.Refunded
    ) {
      return aiLog
    }

    const prepaidPointsBN = new BigNumber(this.getPrepaidPoints(aiLog))
    const actualPointsBN = new BigNumber(actualPoints)
    const deltaPointsBN = actualPointsBN.minus(prepaidPointsBN)

    if (aiLog.userType === UserType.User && !deltaPointsBN.isZero()) {
      const creditMetadata = {
        aiLogId,
        channel: aiLog.channel,
        action: aiLog.action,
        settlementStatus: AiLogSettlementStatus.Settled,
        prepaidPoints: prepaidPointsBN.toNumber(),
        actualPoints: actualPointsBN.toNumber(),
        deltaPoints: deltaPointsBN.toNumber(),
        ...aiLog.settlement?.metadata,
        ...metadata,
      }

      if (deltaPointsBN.isGreaterThan(0)) {
        await this.creditsHelper.deductCredits({
          userId: aiLog.userId,
          amount: deltaPointsBN.toNumber(),
          type: CreditsType.AiService,
          source: creditMetadata.source,
          description: aiLog.model,
          metadata: {
            ...creditMetadata,
            settlementType: AiLogSettlementType.AsyncSuccessDeltaDeduct,
          },
        })
      }
      else {
        await this.creditsHelper.addCredits({
          userId: aiLog.userId,
          amount: deltaPointsBN.abs().toNumber(),
          type: CreditsType.AiService,
          description: aiLog.model,
          metadata: {
            ...creditMetadata,
            settlementType: AiLogSettlementType.AsyncSuccessDeltaRefund,
          },
          expiredAt: null,
        })
      }
    }

    return await this.aiLogRepo.updateById(aiLogId, {
      $set: {
        points: actualPointsBN.toNumber(),
        settlement: {
          status: AiLogSettlementStatus.Settled,
          prepaidPoints: prepaidPointsBN.toNumber(),
          actualPoints: actualPointsBN.toNumber(),
          deltaPoints: deltaPointsBN.toNumber(),
          settledAt: new Date(),
          metadata: this.mergeMetadata(aiLog.settlement?.metadata, metadata),
        },
      },
    })
  }

  async markFailed(aiLogId: string, metadata?: AiLogSettlementMetadata) {
    const aiLog = await this.aiLogRepo.getById(aiLogId)
    if (!aiLog) {
      this.logger.warn({ aiLogId }, 'Cannot mark async settlement failed: AiLog not found')
      return null
    }

    if (
      aiLog.settlement?.status === AiLogSettlementStatus.Failed
      || aiLog.settlement?.status === AiLogSettlementStatus.Refunded
      || aiLog.settlement?.status === AiLogSettlementStatus.Settled
    ) {
      return aiLog
    }

    const prepaidPoints = this.getPrepaidPoints(aiLog)

    return await this.aiLogRepo.updateById(aiLogId, {
      $set: {
        settlement: {
          status: AiLogSettlementStatus.Failed,
          prepaidPoints,
          actualPoints: 0,
          deltaPoints: -prepaidPoints,
          metadata: this.mergeMetadata(aiLog.settlement?.metadata, metadata),
        },
      },
    })
  }

  async markRefunded(aiLogId: string, metadata?: AiLogSettlementMetadata) {
    const aiLog = await this.aiLogRepo.getById(aiLogId)
    if (!aiLog) {
      this.logger.warn({ aiLogId }, 'Cannot mark async settlement refunded: AiLog not found')
      return null
    }

    if (aiLog.settlement?.status === AiLogSettlementStatus.Refunded) {
      return aiLog
    }

    if (aiLog.settlement?.status === AiLogSettlementStatus.Settled) {
      return aiLog
    }

    const prepaidPoints = this.getPrepaidPoints(aiLog)

    return await this.aiLogRepo.updateById(aiLogId, {
      $set: {
        points: 0,
        settlement: {
          status: AiLogSettlementStatus.Refunded,
          prepaidPoints,
          actualPoints: 0,
          deltaPoints: -prepaidPoints,
          settledAt: new Date(),
          metadata: this.mergeMetadata(aiLog.settlement?.metadata, metadata),
        },
      },
    })
  }

  @Transactional()
  async refundFailedTask(
    aiLogId: string,
    params: {
      amount: number
      description?: string
      expiredAt?: Date | null
      metadata?: AiLogSettlementMetadata
      userId: string
    },
  ) {
    const aiLog = await this.aiLogRepo.getById(aiLogId)
    if (!aiLog) {
      this.logger.warn({ aiLogId }, 'Cannot refund failed async task: AiLog not found')
      return null
    }

    if (
      aiLog.settlement?.status === AiLogSettlementStatus.Refunded
      || aiLog.settlement?.status === AiLogSettlementStatus.Settled
    ) {
      return aiLog
    }

    await this.creditsHelper.addCredits({
      userId: params.userId,
      amount: params.amount,
      description: params.description,
      metadata: {
        ...params.metadata,
        taskId: aiLogId,
        refundReason: AiLogSettlementRefundReason.AiTaskFailed,
      },
      expiredAt: params.expiredAt ?? null,
    })

    return await this.markRefunded(aiLogId, {
      settledBy: AiLogSettlementSettledBy.AiTaskRefundQueue,
      refundReason: AiLogSettlementRefundReason.AiTaskFailed,
      amount: params.amount,
      ...params.metadata,
    })
  }

  private mergeMetadata(
    current?: AiLogSettlementMetadata,
    incoming?: AiLogSettlementMetadata,
  ): AiLogSettlementMetadata | undefined {
    const merged = {
      ...(current || {}),
      ...(incoming || {}),
    }

    return Object.keys(merged).length > 0 ? merged : undefined
  }
}
