/**
 * 已发布内容更新消费者
 *
 * 用于处理已发布帖子的内容更新请求。
 * 当用户需要修改已发布到平台的帖子内容时，通过此消费者处理更新操作。
 *
 * 监听队列：UpdatePublishedPost
 * 主要职责：
 * - 仅处理状态为 WAITING_FOR_UPDATE 的任务
 * - 调用 updatePublishedPost 更新已发布的内容
 * - 更新成功后状态变为 PUBLISHED，失败则变为 UPDATED_FAILED
 */
import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { QueueName, QueueProcessor } from '@yikart/aitoearn-queue'
import { AccountType, getErrorMessage, getErrorStack } from '@yikart/common'
import { PublishStatus } from '@yikart/mongodb'
import { Job } from 'bullmq'
import { ChannelAccountService } from '../../platforms/channel-account.service'
import { PublishingErrorHandler } from '../error-handler.service'
import { PublishService } from '../providers/base.service'
import { PublishingUnrecoverableError } from '../publishing.exception'
import { PublishingTaskResult } from '../publishing.interface'
import { PublishingService } from '../publishing.service'

@QueueProcessor(QueueName.UpdatePublishedPost, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class UpdatePublishedPostConsumer extends WorkerHost {
  private readonly logger = new Logger(UpdatePublishedPostConsumer.name)
  @Inject('PUBLISHING_PROVIDERS')
  private readonly publishingProviders: Record<AccountType, PublishService>

  constructor(
    readonly publishingService: PublishingService,
    private readonly publishingErrorHandler: PublishingErrorHandler,
    private readonly channelAccountService: ChannelAccountService,
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

      if (publishTaskInfo.accountId) {
        const account = await this.channelAccountService.getAccountInfo(publishTaskInfo.accountId)
        if (account?.relayAccountRef) {
          this.logger.warn(`[task-${taskId}] Relay account task reached update consumer, skipping`)
          await this.publishingService.updatePublishTaskStatus(taskId, {
            status: PublishStatus.FAILED,
            errorMsg: 'Relay account task should not reach queue consumer',
          })
          return
        }
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

      const taskInfo = publishTaskInfo
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
    const errorMessage = getErrorMessage(error)
    const errorStack = getErrorStack(error)
    this.logger.warn(`[task-${job.data.taskId}] Update published post task failed, error: ${errorMessage}, retrying... Attempts made: ${job.attemptsMade}`)
    if (errorStack) {
      this.logger.error(`[task-${job.data.taskId}] Error stack:\n${errorStack}`)
    }
    if (error instanceof PublishingUnrecoverableError && error.originalStack) {
      this.logger.error(`[task-${job.data.taskId}] Original error stack:\n${error.originalStack}`)
    }
    if (job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
      this.logger.error(`[task-${job.data.taskId}] Update published post task failed after ${job.attemptsMade} attempts, error: ${errorMessage}`)
      await this.publishingService.updatePublishTaskStatus(job.data.taskId, {
        status: PublishStatus.UPDATED_FAILED,
        errorMsg: errorMessage,
      })
    }
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.error(`Job ${job.id} is stalled, data ${job.data}`)
  }
}
