import path from 'node:path'
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger, OnModuleDestroy } from '@nestjs/common'
import { QueueName } from '@yikart/aitoearn-queue'
import { S3Service } from '@yikart/aws-s3'
import { Job, UnrecoverableError } from 'bullmq'
import { AccountService } from '../account/account.service'

@Processor(QueueName.DumpSocialMediaAvatar, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class DumpAvatarConsumer extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(DumpAvatarConsumer.name)
  constructor(
    private readonly s3Service: S3Service,
    private readonly accountService: AccountService,
  ) {
    super()
  }

  private async uploadImageToS3(accountId: string, platform: string, imageUrl: string): Promise<string> {
    const filename = `${Date.now().toString(36)}-${path.basename(imageUrl.split('?')[0])}`
    const fullPath = path.join('social/avatar', platform, accountId, filename)
    const result = await this.s3Service.putObjectFromUrl(imageUrl, fullPath)
    return result.path
  }

  async process(
    job: Job<{
      accountId: string
    }>,
  ): Promise<any> {
    try {
      const account = await this.accountService.getAccountInfo(job.data.accountId)
      const avatar = account?.avatar
      if (avatar && avatar.startsWith('http')) {
        const s3Path = await this.uploadImageToS3(
          job.data.accountId,
          account.type,
          avatar,
        )
        await this.accountService.updateAccountInfo(account.userId, job.data.accountId, {
          id: job.data.accountId,
          avatar: s3Path,
        })
        this.logger.log(`[account-${job.data.accountId}] Avatar dumped to S3: ${s3Path}`)
        return { success: true, path: s3Path }
      }
    }
    catch (error) {
      this.logger.error(`[account-${job.data.accountId}] Failed to dump avatar: ${error.message}`)
      throw new UnrecoverableError(error)
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

  async onModuleDestroy() {
    this.logger.log('PostPublishConsumer is being destroyed, closing worker...')
    await this.worker.close()
    this.logger.log('PostPublishConsumer closed successfully')
  }
}
