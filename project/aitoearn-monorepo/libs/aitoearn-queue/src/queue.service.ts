import type { Job, JobsOptions, Queue } from 'bullmq'
import type {
  AiImageData,
  CloudspaceConfigureData,
  CloudspaceExpirationData,
  EngagementReplyToCommentData,
  EngagementTaskDistributionData,
  MaterialGenerateData,
  PostMediaTaskData,
  PostPublishData,
  TaskAccountPortraitData,
  TaskAuditData,
  TaskUserCreateData,
  TaskUserPortraitData,
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
    @InjectQueue(QueueName.CloudspaceConfigure)
    private cloudspaceConfigureQueue: Queue,
    @InjectQueue(QueueName.CloudspaceExpiration)
    private cloudspaceExpirationQueue: Queue,
    @InjectQueue(QueueName.TaskUserCreatePush)
    private taskUserCreatePushQueue: Queue,
    @InjectQueue(QueueName.TaskUserPortraitReport)
    private taskUserPortraitReportQueue: Queue,
    @InjectQueue(QueueName.TaskAccountPortraitReport)
    private taskAccountPortraitReportQueue: Queue,
  ) {
    // 从配置中读取默认的 job options
    this.defaultOptions = config.jobOptions || {
      removeOnComplete: true,
      removeOnFail: true,
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
   * 获取素材生成任务
   */
  async getMaterialGenerateJob(jobId: string): Promise<Job<MaterialGenerateData> | undefined> {
    return await this.materialGenerateQueue.getJob(jobId)
  }

  /**
   * 移除素材生成任务
   */
  async removeMaterialGenerateJob(jobId: string) {
    const job = await this.materialGenerateQueue.getJob(jobId)
    if (job) {
      await job.remove()
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
   * 移除发布任务
   */
  async removePostPublishJob(jobId: string) {
    const job = await this.postPublishQueue.getJob(jobId)
    if (job) {
      await job.remove()
    }
  }

  /**
   * 关闭发布队列
   */
  async closePostPublishQueue() {
    await this.postPublishQueue.close()
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
   * 获取发布媒体任务
   */
  async getPostMediaTaskJob(jobId: string): Promise<Job<PostMediaTaskData> | undefined> {
    return await this.postMediaTaskQueue.getJob(jobId)
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
   * 获取任务审核任务
   */
  async getTaskAuditJob(jobId: string): Promise<Job<TaskAuditData> | undefined> {
    return await this.taskAuditQueue.getJob(jobId)
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
   * 获取AI图片异步生成任务
   */
  async getAiImageAsyncJob(jobId: string): Promise<Job<AiImageData> | undefined> {
    return await this.aiImageAsyncQueue.getJob(jobId)
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

  /**
   * 获取互动任务分发任务
   */
  async getEngagementTaskDistributionJob(
    jobId: string,
  ): Promise<Job<EngagementTaskDistributionData> | undefined> {
    return await this.engagementTaskDistributionQueue.getJob(jobId)
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

  /**
   * 获取评论回复任务
   */
  async getEngagementReplyToCommentJob(
    jobId: string,
  ): Promise<Job<EngagementReplyToCommentData> | undefined> {
    return await this.engagementReplyToCommentQueue.getJob(jobId)
  }

  /**
   * 添加云空间配置任务
   */
  async addCloudspaceConfigureJob(data: CloudspaceConfigureData, options?: JobsOptions) {
    return await this.cloudspaceConfigureQueue.add('configure', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  /**
   * 获取云空间配置任务
   */
  async getCloudspaceConfigureJob(
    jobId: string,
  ): Promise<Job<CloudspaceConfigureData> | undefined> {
    return await this.cloudspaceConfigureQueue.getJob(jobId)
  }

  /**
   * 添加云空间过期处理任务
   */
  async addCloudspaceExpirationJob(data: CloudspaceExpirationData, options?: JobsOptions) {
    return await this.cloudspaceExpirationQueue.add('expire', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  /**
   * 获取云空间过期处理任务
   */
  async getCloudspaceExpirationJob(
    jobId: string,
  ): Promise<Job<CloudspaceExpirationData> | undefined> {
    return await this.cloudspaceExpirationQueue.getJob(jobId)
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
   * 获取用户创建时推送任务
   */
  async getTaskUserCreatePushJob(jobId: string): Promise<Job<TaskUserCreateData> | undefined> {
    return await this.taskUserCreatePushQueue.getJob(jobId)
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
   * 获取用户画像上报任务
   */
  async getTaskUserPortraitReportJob(
    jobId: string,
  ): Promise<Job<TaskUserPortraitData> | undefined> {
    return await this.taskUserPortraitReportQueue.getJob(jobId)
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
   * 获取频道账号画像上报任务
   */
  async getTaskAccountPortraitReportJob(
    jobId: string,
  ): Promise<Job<TaskAccountPortraitData> | undefined> {
    return await this.taskAccountPortraitReportQueue.getJob(jobId)
  }
}
