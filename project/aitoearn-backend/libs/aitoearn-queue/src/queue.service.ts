import type { Job, JobsOptions, Queue } from 'bullmq'
import type {
  AgentTaskAnalysisData,
  AiImageData,
  DraftGenerationData,
  EngagementReplyToCommentData,
  EngagementTaskDistributionData,
  MaterialGenerateData,
  PostMediaTaskData,
  PostPublishData,
} from './interfaces'
import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { QueueName } from './enums'
import { ContentGenerationTaskData } from './interfaces/content-generation-task.interface'
import { QueueConfig } from './queue.config'

export interface DraftGenerationQueueInfo {
  position: number | null
  waitingCount: number
}

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
    @InjectQueue(QueueName.UpdatePublishedPost)
    private updatePublishedPostQueue: Queue,
    @InjectQueue(QueueName.ContentGenerationTask)
    private contentGenerationTaskQueue: Queue,
    @InjectQueue(QueueName.AgentTaskAnalysis)
    private agentTaskAnalysisQueue: Queue,
    @InjectQueue(QueueName.DraftGeneration)
    private draftGenerationQueue: Queue,
    @InjectQueue(QueueName.DraftGenerationLowPriority)
    private draftGenerationLowPriorityQueue: Queue,
  ) {
    // 从配置中读取默认的 job options
    this.defaultOptions = config.jobOptions || {
      removeOnComplete: { age: 30, count: 1000 },
      removeOnFail: { age: 60, count: 1000 },
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
   * 添加AI图片异步生成任务
   */
  async addAiImageAsyncJob(data: AiImageData, options?: JobsOptions) {
    return await this.aiImageAsyncQueue.add('generate', data, {
      ...this.defaultOptions,
      jobId: data.logId,
      ...options,
    })
  }

  async isAiImageAsyncJobActive(aiLogId: string): Promise<boolean> {
    if (await this.isJobActive(await this.aiImageAsyncQueue.getJob(aiLogId))) {
      return true
    }

    const activeJobs = await this.aiImageAsyncQueue.getJobs(['active'], 0, -1, true)
    return activeJobs.some(job => job?.data?.logId === aiLogId)
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

  async addContentGenerationTaskJob(data: ContentGenerationTaskData, options?: JobsOptions) {
    return await this.contentGenerationTaskQueue.add('generate', data, {
      ...this.defaultOptions,
      ...options,
    })
  }

  /**
   * 添加Agent任务分析任务
   */
  async addAgentTaskAnalysisJob(data: AgentTaskAnalysisData, options?: JobsOptions) {
    return await this.agentTaskAnalysisQueue.add('analyze', data, {
      ...this.defaultOptions,
      jobId: data.taskId,
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
      ...options,
      jobId: data.aiLogId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    })
  }

  /**
   * 添加低优先级 DraftGeneration 生成任务
   */
  async addLowPriorityDraftGenerationJob(data: DraftGenerationData, options?: JobsOptions) {
    return await this.draftGenerationLowPriorityQueue.add('generate', data, {
      ...this.defaultOptions,
      ...options,
      jobId: data.aiLogId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    })
  }

  async getDraftGenerationQueueInfo(aiLogId: string): Promise<DraftGenerationQueueInfo | undefined> {
    const normalQueueInfo = await this.getDraftGenerationQueueInfoFromQueue(this.draftGenerationQueue, aiLogId)
    if (normalQueueInfo) {
      return normalQueueInfo
    }

    return await this.getDraftGenerationQueueInfoFromQueue(this.draftGenerationLowPriorityQueue, aiLogId)
  }

  async isDraftGenerationJobActive(aiLogId: string): Promise<boolean> {
    return await this.isJobActive(await this.draftGenerationQueue.getJob(aiLogId))
      || await this.isJobActive(await this.draftGenerationLowPriorityQueue.getJob(aiLogId))
  }

  private async getDraftGenerationQueueInfoFromQueue(queue: Queue, jobId: string): Promise<DraftGenerationQueueInfo | undefined> {
    const job = await queue.getJob(jobId)
    if (!job) {
      return undefined
    }

    const [state, waitingCount] = await Promise.all([
      job.getState(),
      queue.count(),
    ])
    let position: number | null = null

    if (state === 'waiting' || state === 'prioritized' || state === 'delayed' || state === 'waiting-children') {
      const jobs = await queue.getJobs(['prioritized', 'waiting', 'delayed', 'waiting-children'], 0, -1, true)
      const index = jobs.findIndex(item => item?.id === jobId)
      position = index >= 0 ? index + 1 : null
    }

    return { position, waitingCount }
  }

  private async isJobActive(job?: Job | undefined): Promise<boolean> {
    return !!job && await job.getState() === 'active'
  }
}
