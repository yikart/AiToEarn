import { WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { CreditsPurchaseData, QueueName, QueueProcessor } from '@yikart/aitoearn-queue'
import { AddCreditsDto } from '@yikart/helpers'
import { Job } from 'bullmq'
import { CreditsService } from './credits.service'

@QueueProcessor(QueueName.CreditsPurchase, {
  concurrency: 5,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class CreditsPurchaseConsumer extends WorkerHost {
  private readonly logger = new Logger(CreditsPurchaseConsumer.name)

  constructor(private readonly creditsService: CreditsService) {
    super()
  }

  async process(job: Job<CreditsPurchaseData>): Promise<void> {
    const { userId, checkoutId, amount, type, description, metadata, expiredAt } = job.data
    this.logger.debug({ userId, checkoutId, amount }, 'Processing Credits purchase')

    const addCreditsDto = AddCreditsDto.create({
      userId,
      amount,
      type,
      description,
      metadata,
      expiredAt,
    })
    await this.creditsService.addCredits(addCreditsDto)
  }
}
