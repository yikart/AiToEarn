import { Inject, Injectable } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { PostCategory, PostMediaStatus, PostSubCategory } from '@yikart/channel-db'
import { PublishRecord, PublishStatus } from '@yikart/mongodb'
import { PublishRecordService } from '../../../publish-record/publish-record.service'
import { MediaStagingService } from '../media-staging.service'
import { CreatePublishDto } from '../publish.dto'
import { PublishingException } from '../publishing.exception'
import { MediaProcessingStatus, MediaProcessingStatusResult, PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'

@Injectable()
export abstract class PublishService {
  protected readonly queueAttempts: number = 3
  protected readonly queueDelay: number = 5
  protected readonly ProcessMediaFailed: string = 'failed'
  protected readonly ProcessMediaInProgress: string = 'processing'
  protected readonly ProcessMediaCompleted: string = 'completed'

  @Inject(PublishRecordService)
  protected readonly publishRecordService: PublishRecordService

  @Inject(QueueService)
  protected readonly queueService: QueueService

  @Inject(MediaStagingService)
  protected readonly mediaStagingService: MediaStagingService

  constructor() { }

  /**
   * 立即发布任务，由各平台子类实现
   * @param _publishTask 发布记录
   */
  abstract immediatePublish(_publishTask: PublishRecord): Promise<PublishingTaskResult>

  /**
   * 验证发布是否真的成功，如果成功则补足作品链接并更新发布状态为已完成
   * @param publishRecord 发布记录
   * @returns 验证结果，包含是否成功、作品链接、错误信息
   */
  abstract verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult>

  /**
   * 最终化发布流程，在媒体处理完成后执行平台特定的发布逻辑
   * @param _publishTask 发布记录
   */
  async finalizePublish(
    _publishTask: PublishRecord,
  ): Promise<PublishingTaskResult | void> {
  }

  /**
   * 更新已发布的作品内容（视频、图片等）
   * @param publishTask 发布记录
   * @param _updatedContentType 更新的内容类型（video/image/text）
   */
  async updatePublishedPost(
    publishTask: PublishRecord,
    _updatedContentType: string,
  ): Promise<PublishingTaskResult> {
    throw new Error(`${publishTask.accountType} 不支持更新已发布的作品`)
  }

  /**
   * 获取单个媒体文件的处理状态，由各平台子类实现
   * @param _accountId 账户ID
   * @param _mediaId 媒体ID
   */
  protected async getMediaProcessingStatus(
    _accountId: string,
    _mediaId: string,
  ): Promise<string | void> {
  }

  /**
   * 创建发布任务记录
   * @param newData 发布任务数据
   */
  protected async createPublishingTask(newData: Partial<PublishRecord>) {
    return await this.publishRecordService.createPublishRecord(newData)
  }

  /**
   * 将发布任务加入消息队列
   * @param task 发布记录
   * @returns 是否成功入队
   */
  async enqueue(task: PublishRecord): Promise<boolean> {
    const jobRes = await this.queueService.addPostPublishJob(
      {
        taskId: task.id,
        jobId: task.id,
        attempts: 0,
      },
      {
        attempts: this.queueAttempts,
        backoff: {
          type: 'exponential',
          delay: this.queueDelay,
        },
        removeOnComplete: true,
        removeOnFail: true,
        jobId: task.id,
      },
    )
    return jobRes.id === task.id
  }

  /**
   * 更新发布任务的队列ID
   * @param id 任务ID
   * @param queueId 队列ID
   */
  async updateQueueId(id: string, queueId: string) {
    return await this.publishRecordService.updateQueueId(id, queueId)
  }

  /**
   * 根据ID获取发布任务信息
   * @param id 任务ID
   */
  protected async getPublishingTaskInfo(id: string) {
    return await this.publishRecordService.getOneById(id)
  }

  /**
   * 标记发布任务为失败状态
   * @param id 任务ID
   * @param errMsg 错误信息
   */
  protected async failPublishingTask(id: string, errMsg: string) {
    await this.publishRecordService.failById(
      id,
      errMsg,
    )
  }

  /**
   * 生成帖子内容文本，将描述和话题拼接为发布文案
   * @param publishTask 发布记录
   * @returns 拼接后的帖子文本
   */
  protected generatePostMessage(publishTask: PublishRecord): string {
    if (!publishTask) {
      return ''
    }
    if (publishTask.topics && publishTask.topics.length > 0) {
      if (publishTask.desc) {
        return `${publishTask.desc} #${publishTask.topics.join(' #')}`
      }
      return `#${publishTask.topics.join(' #')}`
    }
    return publishTask.desc || ''
  }

  /**
   * 处理媒体上传：保存媒体容器并推入媒体处理队列
   * @param publishTask 发布记录
   * @param platform 平台名称
   * @param category 媒体分类
   * @param subCategory 媒体子分类
   * @param taskId 平台返回的媒体任务ID
   */
  protected async processUploadMedia(
    publishTask: PublishRecord,
    platform: string,
    category: PostCategory,
    subCategory: PostSubCategory,
    taskId: string,
  ): Promise<void> {
    await this.savePostMedia(publishTask, platform, category, subCategory, taskId)
    await this.publishPostMediaTask(publishTask.id, publishTask.queueId || '')
  }

  /**
   * 保存媒体容器记录到暂存区
   * @param publishTask 发布记录
   * @param platform 平台名称
   * @param category 媒体分类
   * @param subCategory 媒体子分类
   * @param taskId 平台返回的媒体任务ID
   * @param status 媒体状态，默认为 CREATED
   */
  protected async savePostMedia(
    publishTask: PublishRecord,
    platform: string,
    category: PostCategory,
    subCategory: PostSubCategory,
    taskId: string,
    status: PostMediaStatus = PostMediaStatus.CREATED,
  ): Promise<void> {
    await this.mediaStagingService.createMediaContainer({
      jobId: publishTask.queueId || '',
      accountId: publishTask.accountId || '',
      publishId: publishTask.id,
      userId: publishTask.userId,
      platform,
      taskId,
      status,
      category,
      subCategory,
    })
  }

  /**
   * 将媒体处理任务推入队列，轮询检查媒体处理状态
   * @param taskId 发布任务ID
   * @param jobId 队列作业ID
   */
  protected async publishPostMediaTask(taskId: string, jobId: string) {
    await this.queueService.addPostMediaTaskJob(
      {
        taskId,
        attempts: 0,
        jobId: `${jobId}-medias`,
      },
      {
        attempts: 5,
        backoff: {
          type: 'fixed',
          delay: 15000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
  }

  /**
   * 批量获取媒体文件的处理状态，检查是否全部完成或有失败
   * @param task 发布记录
   * @returns 媒体处理状态结果，包含各媒体状态、是否全部完成、是否有失败
   */
  protected async getMediasProcessingStatus(task: PublishRecord): Promise<MediaProcessingStatusResult> {
    const mediasStatus: MediaProcessingStatus[] = []
    let hasFailed = false
    const medias = await this.mediaStagingService.getMediaContainers(
      task.id,
      task.queueId || '',
    )
    if (!medias || medias.length === 0) {
      throw PublishingException.nonRetryable(`任务 ${task.id} 未找到媒体文件`)
    }
    // 检查所有媒体文件是否已处理完成
    let completedCount = 0
    for (const media of medias) {
      if (!task.accountId) {
        continue
      }
      if (media.status === PostMediaStatus.FINISHED) {
        mediasStatus.push({ id: media.id, status: media.status, taskId: media.taskId, category: media.category })
        completedCount++
        continue
      }
      let status = PostMediaStatus.IN_PROGRESS
      const mediaStatus = await this.getMediaProcessingStatus(task.accountId, media.taskId)
      // 媒体处理失败，更新状态并中断循环
      if (mediaStatus === this.ProcessMediaFailed) {
        status = PostMediaStatus.FAILED
        hasFailed = true
        break
      }
      if (mediaStatus === this.ProcessMediaCompleted) {
        status = PostMediaStatus.FINISHED
        completedCount++
      }
      await this.mediaStagingService.updateMediaContainer(media.id, {
        status,
      })
      mediasStatus.push({ id: media.id, status, taskId: media.taskId, category: media.category })
    }
    return {
      medias: mediasStatus,
      isCompleted: completedCount === medias.length,
      hasFailed,
    }
  }

  /**
   * 完成发布任务：更新状态为已发布，触发发布完成副作用，提交用户任务
   * @param newData 发布记录
   * @param dataId 平台返回的作品ID
   * @param data 附加数据（作品链接、平台扩展数据）
   */
  async completePublishTask(
    newData: PublishRecord,
    dataId: string,
    data?: {
      workLink: string
      dataOption?: Record<string, any>
    },
  ) {
    newData.status = PublishStatus.PUBLISHED
    newData.publishTime = new Date()
    newData.queued = false
    newData.inQueue = false
    newData.dataId = dataId
    if (data?.workLink) {
      newData.workLink = data.workLink
    }
    await this.publishRecordService.completeById(newData, dataId, data ? { workLink: data.workLink } : undefined)
  }

  /**
   * 更新发布任务状态
   * @param id 任务ID
   * @param status 目标状态
   * @param errMsg 错误信息（可选）
   */
  async updatePublishTaskStatus(id: string, status: PublishStatus, errMsg?: string) {
    await this.publishRecordService.updateStatusById(
      id,
      status,
      errMsg,
    )
  }

  /**
   * 验证发布参数，由各平台子类可重写以添加平台特定校验
   * @param publishTask 发布参数DTO
   * @returns 验证结果，包含是否成功和提示信息
   */
  async validatePublishParams(publishTask: CreatePublishDto): Promise<{
    success: boolean
    message?: string
  }> {
    if (!publishTask.accountType) {
      return {
        success: false,
        message: '账户类型不能为空',
      }
    }
    return {
      success: true,
      message: '发布参数验证通过',
    }
  }
}
