import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger, OnModuleDestroy } from '@nestjs/common'
import { QueueName } from '@yikart/aitoearn-queue'
import { AccountType } from '@yikart/common'
import { Job } from 'bullmq'
import { PublishStatus } from '../../../libs/database/schema/publishTask.schema'
import { PublishingErrorHandler } from '../error-handler.service'
import { PublishService } from '../providers/base.service'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishingService } from '../publishing.service'

@Processor(QueueName.UpdatePublishedPost, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class UpdatePublishedPostConsumer extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(UpdatePublishedPostConsumer.name)
  @Inject('PUBLISHING_PROVIDERS')
  private readonly publishingProviders: Record<AccountType, PublishService>

  constructor(
    readonly publishingService: PublishingService,
    private readonly publishingErrorHandler: PublishingErrorHandler,
  ) {
    super()
  }

  async process(
    job: Job<{
      taskId: string
      updatedContentType: string
      attempts: number
      jobId?: string
      timeout?: number
    }>,
  ): Promise<PublishingTaskResult | void> {
    const { taskId, updatedContentType, attempts } = job.data
    this.logger.log(`[task-${taskId}] Processing Update Published Post Task, data: ${JSON.stringify(job.data)}, Attempts: ${attempts}`)

    try {
      const publishTaskInfo = await this.publishingService.getPublishTaskInfo(taskId)
      if (!publishTaskInfo) {
        this.logger.error(`[task-${taskId}] Update published post task not found: ${taskId}`)
        return
      }

      if (publishTaskInfo.status !== PublishStatus.WAITING_FOR_UPDATE) {
        this.logger.warn(`[task-${taskId}] Update published post task not waiting for update: ${taskId}`)
        return
      }

      await this.publishingService.updatePublishTaskStatus(taskId, {
        status: PublishStatus.UPDATING,
        errorMsg: '',
        inQueue: true,
        queued: true,
      })

      const taskInfo = publishTaskInfo.toObject()
      const publishingProvider = this.publishingProviders[taskInfo.accountType]
      if (!publishingProvider) {
        this.logger.error(`[task-${taskId}] Publishing provider not found for account type: ${taskInfo.accountType}`)
        return
      }
      const result = await publishingProvider.updatePublishedPost(taskInfo, updatedContentType)
      if (result.status === PublishStatus.PUBLISHED) {
        await this.publishingService.updatePublishTaskStatus(taskId, {
          status: PublishStatus.PUBLISHED,
          errorMsg: '',
          inQueue: false,
          queued: false,
        })
      }
      else {
        await this.publishingService.updatePublishTaskStatus(taskId, {
          status: result.status,
          errorMsg: '',
          inQueue: false,
          queued: false,
        })
      }
    }
    catch (error: unknown) {
      await this.publishingErrorHandler.handle(taskId, error, job)
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>) {
    const { taskId, attempts, jobId } = job.data
    this.logger.log(`[task-${taskId}] Update published post task completed for job ${jobId}, taskId: ${taskId}, Attempts: ${attempts}`)
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>, error: unknown) {
    this.logger.warn(`[task-${job.data.taskId}] Update published post task failed, error: ${error.toString()}, retrying... Attempts made: ${job.attemptsMade}`)
    if (job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
      this.logger.error(`[task-${job.data.taskId}] Update published post task failed after ${job.attemptsMade} attempts, error: ${error.toString()}`)
      await this.publishingService.updatePublishTaskStatus(job.data.taskId, {
        status: PublishStatus.UPDATED_FAILED,
        errorMsg: error.toString(),
      })
    }
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.error(`Job ${job.id} is stalled, data ${job.data}`)
  }

  async onModuleDestroy() {
    this.logger.log('UpdatePublishedPostConsumer is being destroyed, closing worker...')
    await this.worker.close()
    this.logger.log('UpdatePublishedPostConsumer closed successfully')
  }
}
