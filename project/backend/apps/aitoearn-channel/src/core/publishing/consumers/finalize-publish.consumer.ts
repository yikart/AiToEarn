import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger, OnModuleDestroy } from '@nestjs/common'
import { QueueName } from '@yikart/aitoearn-queue'
import { AccountType } from '@yikart/common'
import { Job } from 'bullmq'
import { PublishStatus } from '../../../libs/database/schema/publishTask.schema'
import { PublishingErrorHandler } from '../error-handler.service'
import { PublishService } from '../providers/base.service'
import { PublishingService } from '../publishing.service'

@Processor(QueueName.PostMediaTask, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class FinalizePublishPostConsumer extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(FinalizePublishPostConsumer.name)

  @Inject('PUBLISHING_PROVIDERS')
  private readonly publishingProviders: Record<AccountType, PublishService>

  constructor(
    readonly publishingService: PublishingService,
    private readonly publishingErrorHandler: PublishingErrorHandler,
  ) {
    super()
  }

  async process(job: Job<{
    taskId: string
    attempts: number
  }>): Promise<any> {
    this.logger.log(`[task-${job.data.taskId}] Processing Meta Post Publish Task: ${job.data.taskId}`)
    try {
      const publishTaskInfo = await this.publishingService.getPublishTaskInfo(job.data.taskId)
      const publishTask = publishTaskInfo!.toObject()
      if (!publishTask) {
        this.logger.error(`[task-${job.data.taskId}] Publish task not found: ${job.data.taskId}`)
        return
      }
      const publishingProvider = this.publishingProviders[publishTask.accountType]
      if (!publishingProvider) {
        this.logger.error(`[task-${job.data.taskId}] Publishing provider not found for account type: ${publishTask.accountType}`)
        return
      }
      const result = await publishingProvider.finalizePublish(publishTask)
      if (result && result.status === PublishStatus.PUBLISHED) {
        await this.publishingService.completePublishTask(publishTask, result.postId, {
          workLink: result.permalink,
          ...result.extra,
        })
      }
    }
    catch (error) {
      await this.publishingErrorHandler.handle(job.data.taskId, error, job)
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>) {
    const { attempts } = job.data
    this.logger.log(`[task-${job.data.taskId}] Publish Post Task completed: ${job.data.taskId} after ${job.attemptsMade} attempts (max: ${attempts})`)
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>, error: unknown) {
    this.logger.warn(`[task-${job.data.taskId}] finalize publish task failed, error: ${error.toString()}, retrying... Attempts made: ${job.attemptsMade}`)
    if (job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
      this.logger.error(`[task-${job.data.taskId}] Finalize publish task failed after ${job.attemptsMade} attempts, error: ${error.toString()}`)
      await this.publishingService.updatePublishTaskStatus(job.data.taskId, {
        status: PublishStatus.FAILED,
        errorMsg: error.toString(),
      })
    }
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>) {
    this.logger.error(`[task-${job.data.taskId}] Job stalled: ${job.id}`)
  }

  async onModuleDestroy() {
    this.logger.log('FinalizePublishPostConsumer is being destroyed, closing worker...')
    await this.worker.close()
    this.logger.log('FinalizePublishPostConsumer closed successfully')
  }
}
