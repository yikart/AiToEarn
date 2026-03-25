/**
 * 即时发布消费者
 *
 * 用于处理帖子的即时发布请求，是发布流程的主要入口。
 * 根据不同平台的特性，发布结果可能有以下几种情况：
 * - PUBLISHED：发布成功，内容已上线
 * - PUBLISHING：发布进行中（某些平台需要异步处理，后续由 FinalizePublishPostConsumer 完成）
 * - 其他状态：发布失败或需要进一步处理
 *
 * 监听队列：PostPublish
 * 主要职责：
 * - 调用 immediatePublish 执行发布操作
 * - 根据发布结果更新任务状态
 * - 对于需要两步发布的平台，标记为 PUBLISHING 等待后续处理
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

@QueueProcessor(QueueName.PostPublish, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class ImmediatePublishPostConsumer extends WorkerHost {
  private readonly logger = new Logger(ImmediatePublishPostConsumer.name)
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
      attempts: number
      jobId?: string
      timeout?: number
    }>,
  ): Promise<PublishingTaskResult | void> {
    const { taskId, attempts } = job.data
    this.logger.log(`[task-${taskId}] Processing Publish Task, data: ${JSON.stringify(job.data)}, Attempts: ${attempts}`)

    try {
      // 获取并校验任务状态
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

      // 安全检查：relay 账号任务不应到达队列消费者
      if (publishTaskInfo.accountId) {
        const account = await this.channelAccountService.getAccountInfo(publishTaskInfo.accountId)
        if (account?.relayAccountRef) {
          this.logger.warn(`[task-${taskId}] Relay account ${publishTaskInfo.accountId} task reached queue consumer, skipping`)
          await this.publishingService.updatePublishTaskStatus(taskId, {
            status: PublishStatus.FAILED,
            errorMsg: 'Relay account task should not reach queue consumer',
          })
          return { status: PublishStatus.FAILED }
        }
      }

      // 标记为「发布中」
      await this.publishingService.updatePublishTaskStatus(taskId, {
        status: PublishStatus.PUBLISHING,
        errorMsg: '',
        inQueue: true,
        queued: true,
      })

      // 获取对应平台的发布 Provider 并执行发布
      const taskInfo = publishTaskInfo
      const publishingProvider = this.publishingProviders[taskInfo.accountType]
      if (!publishingProvider) {
        this.logger.error(`[task-${taskId}] Publishing provider not found for account type: ${taskInfo.accountType}`)
        return
      }
      const result = await publishingProvider.immediatePublish(taskInfo)

      // 根据发布结果处理：成功 / 异步等待回调 / 其他状态
      if (result.status === PublishStatus.PUBLISHED) {
        // 发布成功，完成任务
        await publishingProvider.completePublishTask(taskInfo, result.postId || '', {
          workLink: result.permalink || '',
          ...result.extra,
        })
      }
      else if (result.status === PublishStatus.PUBLISHING && result.postId) {
        // 异步发布中，等待平台 webhook 回调后由 FinalizePublishPostConsumer 完成
        await this.publishingService.markTaskAsPublishing(taskId, result.postId, result.permalink)
      }
      else {
        // 其他状态，更新并移出队列
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
    this.logger.log(`[task-${taskId}] Processing completed for job ${jobId}, taskId: ${taskId}, Attempts: ${attempts}`)
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>, error: unknown) {
    const errorMessage = getErrorMessage(error)
    const errorStack = getErrorStack(error)
    this.logger.warn(`[task-${job.data.taskId}] Immediate publish task failed, error: ${errorMessage}, retrying... Attempts made: ${job.attemptsMade}`)
    if (errorStack) {
      this.logger.error(`[task-${job.data.taskId}] Error stack:\n${errorStack}`)
    }
    if (error instanceof PublishingUnrecoverableError && error.originalStack) {
      this.logger.error(`[task-${job.data.taskId}] Original error stack:\n${error.originalStack}`)
    }
    if (job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
      this.logger.error(`[task-${job.data.taskId}] Immediate publish task failed after ${job.attemptsMade} attempts, error: ${errorMessage}`)
      await this.publishingService.updatePublishTaskStatus(job.data.taskId, {
        status: PublishStatus.FAILED,
        errorMsg: errorMessage,
      })
    }
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.error(`Job ${job.id}] is stalled, data ${job.data}`)
  }
}
