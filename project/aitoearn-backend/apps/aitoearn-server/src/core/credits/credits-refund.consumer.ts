import { WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { CreditsRefundData, QueueName, QueueProcessor } from '@yikart/aitoearn-queue'
import { DeductCreditsDto } from '@yikart/helpers'
import { Job } from 'bullmq'
import { CreditsService } from './credits.service'

@QueueProcessor(QueueName.CreditsRefund, {
  concurrency: 5,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class CreditsRefundConsumer extends WorkerHost {
  private readonly logger = new Logger(CreditsRefundConsumer.name)

  constructor(private readonly creditsService: CreditsService) {
    super()
  }

  async process(job: Job<CreditsRefundData>): Promise<void> {
    const { userId, checkoutId, amount, type, description, metadata } = job.data
    this.logger.debug({ userId, checkoutId, amount }, 'Processing Credits refund')

    const deductCreditsDto = DeductCreditsDto.create({
      userId,
      amount,
      type,
      description,
      metadata,
    })
    await this.creditsService.deductCredits(deductCreditsDto)
  }
}
