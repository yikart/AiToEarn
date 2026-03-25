/**
 * 发布完成消费者
 *
 * 用于处理需要两步发布流程的平台（如 Meta/Facebook）的第二步：完成发布。
 * 某些平台的发布流程分为两步：
 * 1. 第一步：上传媒体文件并创建草稿（由 ImmediatePublishPostConsumer 处理）
 * 2. 第二步：确认并完成发布（由本消费者处理）
 *
 * 监听队列：PostMediaTask
 * 主要职责：调用 finalizePublish 完成发布，更新任务状态为 PUBLISHED
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
import { PublishingService } from '../publishing.service'

@QueueProcessor(QueueName.PostMediaTask, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class FinalizePublishPostConsumer extends WorkerHost {
  private readonly logger = new Logger(FinalizePublishPostConsumer.name)

  @Inject('PUBLISHING_PROVIDERS')
  private readonly publishingProviders: Record<AccountType, PublishService>

  constructor(
    readonly publishingService: PublishingService,
    private readonly publishingErrorHandler: PublishingErrorHandler,
    private readonly channelAccountService: ChannelAccountService,
  ) {
    super()
  }

  async process(job: Job<{
    taskId: string
    attempts: number
  }>): Promise<any> {
    this.logger.log(`[task-${job.data.taskId}] Processing Meta Post Publish Task: ${job.data.taskId}`)
    try {
      // 获取发布任务信息
      const publishTaskInfo = await this.publishingService.getPublishTaskInfo(job.data.taskId)
      const publishTask = publishTaskInfo!
      if (!publishTask) {
        this.logger.error(`[task-${job.data.taskId}] Publish task not found: ${job.data.taskId}`)
        return
      }

      // 安全检查：relay 账号任务不应到达队列消费者
      if (publishTask.accountId) {
        const account = await this.channelAccountService.getAccountInfo(publishTask.accountId)
        if (account?.relayAccountRef) {
          this.logger.warn(`[task-${job.data.taskId}] Relay account ${publishTask.accountId} task reached queue consumer, skipping`)
          await this.publishingService.updatePublishTaskStatus(job.data.taskId, {
            status: PublishStatus.FAILED,
            errorMsg: 'Relay account task should not reach queue consumer',
          })
          return
        }
      }

      // 获取对应平台的发布 Provider
      const publishingProvider = this.publishingProviders[publishTask.accountType]
      if (!publishingProvider) {
        this.logger.error(`[task-${job.data.taskId}] Publishing provider not found for account type: ${publishTask.accountType}`)
        return
      }
      // 执行二次发布确认（如 Meta 的媒体发布确认）
      const result = await publishingProvider.finalizePublish(publishTask)
      // 发布成功则完成任务
      if (result && result.status === PublishStatus.PUBLISHED) {
        await publishingProvider.completePublishTask(publishTask, result.postId || '', {
          workLink: result.permalink || '',
          ...result.extra,
        })
      }
    }
    catch (error) {
      // 统一错误处理
      this.logger.error(error, `[task-${job.data.taskId}] Processing Meta Post Publish Task: ${job.data.taskId} Error`)
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
    const errorMessage = getErrorMessage(error)
    const errorStack = getErrorStack(error)
    this.logger.error(error, `[task-${job.data.taskId}] finalize publish task failed`)
    this.logger.warn(`[task-${job.data.taskId}] finalize publish task failed, error: ${errorMessage}, retrying... Attempts made: ${job.attemptsMade}`)
    if (errorStack) {
      this.logger.error(`[task-${job.data.taskId}] Error stack:\n${errorStack}`)
    }
    if (error instanceof PublishingUnrecoverableError && error.originalStack) {
      this.logger.error(`[task-${job.data.taskId}] Original error stack:\n${error.originalStack}`)
    }
    // 重试次数耗尽，标记任务为失败
    if (job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
      this.logger.error(`[task-${job.data.taskId}] Finalize publish task failed after ${job.attemptsMade} attempts, error: ${errorMessage}`)
      await this.publishingService.updatePublishTaskStatus(job.data.taskId, {
        status: PublishStatus.FAILED,
        errorMsg: errorMessage,
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
}
