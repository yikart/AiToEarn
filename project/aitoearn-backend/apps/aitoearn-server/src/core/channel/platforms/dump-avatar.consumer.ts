import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { QueueName, QueueProcessor } from '@yikart/aitoearn-queue'
import { AssetsService } from '@yikart/assets'
import { AssetType } from '@yikart/mongodb'
import { Job } from 'bullmq'
import { PublishingUnrecoverableError } from '../publishing/publishing.exception'
import { ChannelAccountService } from './channel-account.service'

@QueueProcessor(QueueName.DumpSocialMediaAvatar, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class DumpAvatarConsumer extends WorkerHost {
  private readonly logger = new Logger(DumpAvatarConsumer.name)
  constructor(
    private readonly assetsService: AssetsService,
    private readonly channelAccountService: ChannelAccountService,
  ) {
    super()
  }

  async process(
    job: Job<{
      accountId: string
    }>,
  ): Promise<any> {
    try {
      const account = await this.channelAccountService.getAccountInfo(job.data.accountId)
      const avatar = account?.avatar
      if (avatar && avatar.startsWith('http')) {
        const result = await this.assetsService.uploadFromUrl(account.userId, {
          url: avatar,
          type: AssetType.Avatar,
        }, account.type)
        await this.channelAccountService.updateAccountInfo(job.data.accountId, {
          id: job.data.accountId,
          avatar: result.asset.path,
        })
        this.logger.log(`[account-${job.data.accountId}] Avatar dumped to S3: ${result.asset.path}`)
        return { success: true, path: result.asset.path }
      }
    }
    catch (error) {
      this.logger.error(`[account-${job.data.accountId}] Failed to dump avatar: ${(error as Error).message}`)
      throw new PublishingUnrecoverableError(String(error), error)
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<{
    accountId: string
  }>) {
    const { accountId } = job.data
    this.logger.log(`[account-${accountId}] Processing completed for job ${job.id}, Attempts: ${job.attemptsMade}`)
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.error(`Job ${job.id}] is stalled, data ${job.data}`)
  }
}
