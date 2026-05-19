import type { Job, JobsOptions, Queue } from 'bullmq'
import type {
  AiImageData,
  AiTaskRefundData,
  DraftGenerationData,
  EngagementReplyToCommentData,
  EngagementTaskDistributionData,
  NotificationData,
  PostMediaTaskData,
  PostPublishData,
  UserEventBatchData,
} from './interfaces'
import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { QueueName } from './enums'
import { QueueConfig } from './queue.config'

/**
 * 统一的队列服务
 * 提供所有队列的操作方法
 */
@Injectable()
export class QueueService {
  private readonly defaultOptions: JobsOptions

  constructor(
    config: QueueConfig,
    @InjectQueue(QueueName.PostPublish)
    private postPublishQueue: Queue,
    @InjectQueue(QueueName.PostMediaTask)
    private postMediaTaskQueue: Queue,
    @InjectQueue(QueueName.AiImageAsync)
    private aiImageAsyncQueue: Queue,
    @InjectQueue(QueueName.EngagementTaskDistribution)
    private engagementTaskDistributionQueue: Queue,
    @InjectQueue(QueueName.EngagementReplyToComment)
    private engagementReplyToCommentQueue: Queue,
    @InjectQueue(QueueName.DumpSocialMediaAvatar)
    private dumpSocialMediaAvatarQueue: Queue,
    @InjectQueue(QueueName.UpdatePublishedPost)
    private updatePublishedPostQueue: Queue,
    @InjectQueue(QueueName.Notification)
    private notificationQueue: Queue,
    @InjectQueue(QueueName.AiTaskRefund)
    private aiTaskRefundQueue: Queue,
    @InjectQueue(QueueName.DraftGeneration)
    private draftGenerationQueue: Queue,
    @InjectQueue(QueueName.DraftGenerationLowPriority)
    private draftGenerationLowPriorityQueue: Queue,
    @InjectQueue(QueueName.UserEventBatch)
    private userEventBatchQueue: Queue,
  ) {
    // 从配置中读取默认的 job options
    this.defaultOptions = config.jobOptions || {
      removeOnComplete: { age: 30, count: 1000 },
      removeOnFail: { age: 60, count: 1000 },
    }
  }

  /**
   * 添加发布任务
   */
  async addPostPublishJob(data: PostPublishData, options?: JobsOptions) {
    return await this.postPublishQueue.add('publish', data, {
      ...this.defaultOptions,
      jobId: data.jobId,
      ...options,
    })
  }

  /**
   * 获取发布任务
   */
  async getPostPublishJob(jobId: string): Promise<Job<PostPublishData> | undefined> {
    return await this.postPublishQueue.getJob(jobId)
  }

  /**
   * 添加发布媒体任务
   */
  async addPostMediaTaskJob(data: PostMediaTaskData, options?: JobsOptions) {
    return await this.postMediaTaskQueue.add('media', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  /**
   * 添加AI图片异步生成任务
   */
  async addAiImageAsyncJob(data: AiImageData, options?: JobsOptions) {
    return await this.aiImageAsyncQueue.add('generate', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  /**
   * 添加互动任务分发任务
   */
  async addEngagementTaskDistributionJob(
    data: EngagementTaskDistributionData,
    options?: JobsOptions,
  ) {
    return await this.engagementTaskDistributionQueue.add('distribute', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  async addUpdatePublishedPostJob(data: { taskId: string, updatedContentType: string }, options?: JobsOptions) {
    return await this.updatePublishedPostQueue.add('update-published-post', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  /**
   * 添加评论回复任务
   */
  async addEngagementReplyToCommentJob(data: EngagementReplyToCommentData, options?: JobsOptions) {
    return await this.engagementReplyToCommentQueue.add('reply', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  async addDumpSocialMediaAvatarJob(data: { accountId: string }, options?: JobsOptions) {
    return await this.dumpSocialMediaAvatarQueue.add('dump-social-avatar', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  async addNotificationJob(data: NotificationData, options?: JobsOptions) {
    return await this.notificationQueue.add('send-notification', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  /**
   * 添加 AI任务失败退款处理任务
   */
  async addAiTaskRefundJob(data: AiTaskRefundData, options?: JobsOptions) {
    return await this.aiTaskRefundQueue.add('refund', data, {
      ...this.defaultOptions,
      jobId: data.taskId,
      removeOnComplete: {
        age: 60 * 60,
      },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      ...options,
    })
  }

  /**
   * 添加 DraftGeneration 生成任务
   */
  async addDraftGenerationJob(data: DraftGenerationData, options?: JobsOptions) {
    return await this.draftGenerationQueue.add('generate', data, {
      ...this.defaultOptions,
      attempts: 2,
      backoff: { type: 'exponential', delay: 10000 },
      ...options,
    })
  }

  /**
   * 添加低优先级 DraftGeneration 生成任务
   */
  async addLowPriorityDraftGenerationJob(data: DraftGenerationData, options?: JobsOptions) {
    return await this.draftGenerationLowPriorityQueue.add('generate', data, {
      ...this.defaultOptions,
      attempts: 2,
      backoff: { type: 'exponential', delay: 10000 },
      ...options,
    })
  }

  /**
   * 添加用户事件批量写入任务
   */
  async addUserEventBatchJob(data: UserEventBatchData, options?: JobsOptions) {
    return await this.userEventBatchQueue.add('batch-insert', data, {
      ...this.defaultOptions,
      ...options,
    })
  }
}
