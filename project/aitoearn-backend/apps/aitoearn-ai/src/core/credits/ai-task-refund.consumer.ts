import { WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { AiTaskRefundData, QueueName, QueueProcessor } from '@yikart/aitoearn-queue'
import { Job } from 'bullmq'
import { AsyncSettlementService } from '../ai/settlement'

@QueueProcessor(QueueName.AiTaskRefund, {
  concurrency: 10,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class AiTaskRefundConsumer extends WorkerHost {
  private readonly logger = new Logger(AiTaskRefundConsumer.name)

  constructor(
    private readonly asyncSettlementService: AsyncSettlementService,
  ) {
    super()
  }

  async process(job: Job<AiTaskRefundData>): Promise<void> {
    const { userId, taskId, amount, description, metadata, expiredAt } = job.data

    this.logger.log({ userId, taskId, amount }, 'Processing AI task refund')

    await this.asyncSettlementService.refundFailedTask(taskId, {
      userId,
      amount,
      description,
      expiredAt: expiredAt ?? null,
      metadata,
    })

    this.logger.log({ userId, taskId, amount }, 'AI task refund completed')
  }
}
