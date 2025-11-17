import type { Job, JobsOptions, Queue } from 'bullmq'
import type {
  AiImageData,
  EngagementReplyToCommentData,
  EngagementTaskDistributionData,
  MaterialGenerateData,
  PostMediaTaskData,
  PostPublishData,
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
    @InjectQueue(QueueName.AiImageAsync)
    private aiImageAsyncQueue: Queue,
    @InjectQueue(QueueName.EngagementTaskDistribution)
    private engagementTaskDistributionQueue: Queue,
    @InjectQueue(QueueName.EngagementReplyToComment)
    private engagementReplyToCommentQueue: Queue,
    @InjectQueue(QueueName.DumpSocialMediaAvatar)
    private dumpSocialMediaAvatarQueue: Queue,
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

  async addDumpSocialMediaAvatarJob(data: { accountId: string }, options?: JobsOptions) {
    return await this.dumpSocialMediaAvatarQueue.add('dump-social-avatar', data, {
      ...this.defaultOptions,
      ...options,
    })
  }
}
