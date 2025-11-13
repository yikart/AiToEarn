import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger, OnModuleDestroy } from '@nestjs/common'
import { QueueName } from '@yikart/aitoearn-queue'
import { AccountType } from '@yikart/common'
import { Job, UnrecoverableError } from 'bullmq'
import { PublishStatus } from '../../../libs/database/schema/publishTask.schema'
import { SocialMediaError } from '../../../libs/exception'
import { PublishService } from '../providers/base.service'
import { PublishingException } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishingService } from '../publishing.service'

@Processor(QueueName.PostPublish, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class ImmediatePublishPostConsumer extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(ImmediatePublishPostConsumer.name)
  @Inject('PUBLISHING_PROVIDERS')
  private readonly publishingProviders: Record<AccountType, PublishService>

  constructor(readonly publishingService: PublishingService) {
    super()
  }

  async process(
    job: Job<{
      taskId: string
      attempts: number
      jobId?: string
      timeout?: number
    }>,
  ): Promise<PublishingTaskResult | void> {
    const { taskId, attempts } = job.data
    this.logger.log(`[task-${taskId}] Processing Publish Task, data: ${JSON.stringify(job.data)}, Attempts: ${attempts}`)

    try {
      const publishTaskInfo = await this.publishingService.getPublishTaskInfo(taskId)
      if (!publishTaskInfo) {
        this.logger.error(`[task-${taskId}] Publish task not found: ${taskId}`)
        return
      }
      if (publishTaskInfo.status === PublishStatus.PUBLISHED) {
        this.logger.warn(`[task-${taskId}] Publish task already published: ${taskId}`)
        return
      }

      if (publishTaskInfo.status === PublishStatus.PUBLISHING) {
        this.logger.warn(`[task-${taskId}] Publish task already publishing: ${taskId}`)
        return
      }

      await this.publishingService.updatePublishTaskStatus(taskId, {
        status: PublishStatus.PUBLISHING,
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
      const result = await publishingProvider.immediatePublish(taskInfo)
      if (result.status === PublishStatus.PUBLISHED) {
        await this.publishingService.completePublishTask(taskInfo, result.postId, {
          workLink: result.permalink,
          ...result.extra,
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
      if (error instanceof PublishingException) {
        if (error.retryable) {
          throw error
        }
        await this.publishingService.updatePublishTaskStatus(taskId, {
          status: PublishStatus.FAILED,
          errorMsg: error.message,
          inQueue: false,
          queued: false,
        })
        throw new UnrecoverableError(error.message)
      }
      if (error instanceof SocialMediaError) {
        if (error.isNetworkError) {
          if (job.opts.backoff) {
            throw error
          }
        }
        await this.publishingService.updatePublishTaskStatus(taskId, {
          status: PublishStatus.FAILED,
          errorMsg: error.message,
          inQueue: false,
          queued: false,
        })
        throw new UnrecoverableError(error.message)
      }
      await this.publishingService.updatePublishTaskStatus(taskId, {
        status: PublishStatus.FAILED,
        errorMsg: error.toString(),
        inQueue: false,
        queued: false,
      })
      throw new UnrecoverableError(error.toString())
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>) {
    const { taskId, attempts, jobId } = job.data
    this.logger.log(`[task-${taskId}] Processing completed for job ${jobId}, taskId: ${taskId}, Attempts: ${attempts}`)
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
  onStalled(job: Job) {
    this.logger.error(`Job ${job.id}] is stalled, data ${job.data}`)
  }

  async onModuleDestroy() {
    this.logger.log('PostPublishConsumer is being destroyed, closing worker...')
    await this.worker.close()
    this.logger.log('PostPublishConsumer closed successfully')
  }
}
