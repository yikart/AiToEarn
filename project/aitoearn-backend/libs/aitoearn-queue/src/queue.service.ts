import type { Job, JobsOptions, Queue } from 'bullmq'
import type {
  AiImageData,
  CreditsPurchaseData,
  CreditsRefundData,
  DraftGenerationData,
  EngagementReplyToCommentData,
  EngagementTaskDistributionData,
  MaterialGenerateData,
  NotificationData,
  PostMediaTaskData,
  PostPublishData,
  TaskAccountPortraitData,
  TaskAuditData,
  TaskUserCreateData,
  TaskUserPortraitData,
  UserTaskAiVerifyData,
} from './interfaces'
import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { QueueName } from './enums'
import { ContentGenerationTaskData } from './interfaces/content-generation-task.interface'
import { QueueConfig } from './queue.config'

/**
 * 统一的队列服务
 * 提供所有队列的操作方法
 */
@Injectable()
export class QueueService {
  private readonly defaultOptions: JobsOptions

  constructor(
    private config: QueueConfig,
    @InjectQueue(QueueName.MaterialGenerate)
    private materialGenerateQueue: Queue,
    @InjectQueue(QueueName.PostPublish)
    private postPublishQueue: Queue,
    @InjectQueue(QueueName.PostMediaTask)
    private postMediaTaskQueue: Queue,
    @InjectQueue(QueueName.TaskAudit)
    private taskAuditQueue: Queue,
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
    @InjectQueue(QueueName.TaskUserCreatePush)
    private taskUserCreatePushQueue: Queue,
    @InjectQueue(QueueName.TaskUserPortraitReport)
    private taskUserPortraitReportQueue: Queue,
    @InjectQueue(QueueName.TaskAccountPortraitReport)
    private taskAccountPortraitReportQueue: Queue,
    @InjectQueue(QueueName.PaymentWebhookProcess)
    private paymentWebhookProcessQueue: Queue,
    @InjectQueue(QueueName.CreditsPurchase)
    private creditsPurchaseQueue: Queue,
    @InjectQueue(QueueName.CreditsRefund)
    private creditsRefundQueue: Queue,
    @InjectQueue(QueueName.ContentGenerationTask)
    private contentGenerationTaskQueue: Queue,
    @InjectQueue(QueueName.Notification)
    private notificationQueue: Queue,
    @InjectQueue(QueueName.DraftGeneration)
    private draftGenerationQueue: Queue,
    @InjectQueue(QueueName.UserTaskAiVerify)
    private userTaskAiVerifyQueue: Queue,
  ) {
    // 从配置中读取默认的 job options
    this.defaultOptions = config.jobOptions || {
      removeOnComplete: { age: 30, count: 1000 },
      removeOnFail: { age: 60, count: 1000 },
      timeout: 5 * 60000,
    }
  }

  /**
   * 添加素材生成任务
   */
  async addMaterialGenerateJob(data: MaterialGenerateData, options?: JobsOptions) {
    return await this.materialGenerateQueue.add('start', data, {
      ...this.defaultOptions,
      ...options,
    })
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
   * 添加任务审核任务
   */
  async addTaskAuditJob(data: TaskAuditData, options?: JobsOptions) {
    return await this.taskAuditQueue.add('audit', data, {
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

  /**
   * 添加用户创建时推送任务
   */
  async addTaskUserCreatePushJob(data: TaskUserCreateData, options?: JobsOptions) {
    return await this.taskUserCreatePushQueue.add('push', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  /**
   * 添加用户画像上报任务
   */
  async addTaskUserPortraitReportJob(data: TaskUserPortraitData, options?: JobsOptions) {
    return await this.taskUserPortraitReportQueue.add('report', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  /**
   * 添加频道账号画像上报任务
   */
  async addTaskAccountPortraitReportJob(data: TaskAccountPortraitData, options?: JobsOptions) {
    return await this.taskAccountPortraitReportQueue.add('report', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  /**
   * 添加支付 Webhook 处理任务
   */
  async addPaymentWebhookProcessJob(data: { id: string }, options?: JobsOptions) {
    return await this.paymentWebhookProcessQueue.add('process-webhook-event', data, {
      ...this.defaultOptions,
      jobId: data.id,
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    })
  }

  /**
   * 添加 Credits 购买处理任务
   */
  async addCreditsPurchaseJob(data: CreditsPurchaseData, options?: JobsOptions) {
    return await this.creditsPurchaseQueue.add('purchase', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  /**
   * 添加 Credits 退款处理任务
   */
  async addCreditsRefundJob(data: CreditsRefundData, options?: JobsOptions) {
    return await this.creditsRefundQueue.add('refund', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  async addContentGenerationTaskJob(data: ContentGenerationTaskData, options?: JobsOptions) {
    return await this.contentGenerationTaskQueue.add('generate', data, {
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
   * 添加 DraftGeneration 生成任务
   */
  async addDraftGenerationJob(data: DraftGenerationData, options?: JobsOptions) {
    return await this.draftGenerationQueue.add('generate', data, {
      ...this.defaultOptions,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      ...options,
    })
  }

  /**
   * 添加用户任务异步验证任务（作品详情获取 + AI 检测）
   */
  async addUserTaskAiVerifyJob(data: UserTaskAiVerifyData, options?: JobsOptions) {
    return await this.userTaskAiVerifyQueue.add('verify', data, {
      ...this.defaultOptions,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      ...options,
    })
  }
}
