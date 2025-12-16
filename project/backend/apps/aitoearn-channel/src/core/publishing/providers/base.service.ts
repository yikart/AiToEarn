import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'

import { QueueService } from '@yikart/aitoearn-queue'
import { PublishRecord } from '@yikart/aitoearn-server-client'
import { Model } from 'mongoose'
import { PostCategory, PostMediaStatus, PostSubCategory } from '../../../libs/database/schema/postMediaContainer.schema'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import { PublishRecordService } from '../../account/publish-record.service'
import { CreatePublishDto } from '../dto/publish.dto'
import { MediaStagingService } from '../media-staging.service'
import { PublishingException } from '../publishing.exception'
import { MediaProcessingStatus, MediaProcessingStatusResult, PublishingTaskResult } from '../publishing.interface'

@Injectable()
export abstract class PublishService {
  protected readonly queueAttempts: number = 3
  protected readonly queueDelay: number = 5
  protected readonly ProcessMediaFailed: string = 'failed'
  protected readonly ProcessMediaInProgress: string = 'processing'
  protected readonly ProcessMediaCompleted: string = 'completed'

  @Inject(QueueService)
  protected readonly queueService: QueueService

  @InjectModel(PublishTask.name)
  protected readonly publishTaskModel: Model<PublishTask>

  @Inject(PublishRecordService)
  protected readonly publishRecordService: PublishRecordService

  @Inject(MediaStagingService)
  protected readonly mediaStagingService: MediaStagingService

  constructor() {}

  abstract immediatePublish(_publishTask: PublishTask): Promise<PublishingTaskResult>

  async finalizePublish(
    _publishTask: PublishTask,
  ): Promise<PublishingTaskResult | void> {
  }

  async updatePublishedPost(
    publishTask: PublishTask,
    _updatedContentType: string,
  ): Promise<PublishingTaskResult> {
    throw new Error(`${publishTask.accountType} does not support update published post`)
  }

  protected async getMediaProcessingStatus(
    _accountId: string,
    _mediaId: string,
  ): Promise<string | void> {
  }

  protected async createPublishingTask(newData: Partial<PublishTask>) {
    return await this.publishTaskModel.create(newData)
  }

  protected async createPublishingRecord(newData: Partial<PublishRecord>) {
    newData.publishTime = newData.publishTime || new Date()
    await this.publishRecordService.createPublishRecord(newData)
  }

  async enqueue(task: PublishTask): Promise<boolean> {
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

  async updateQueueId(id: string, queueId: string) {
    return await this.publishTaskModel.updateOne({ _id: id }, { queueId, queued: true }).exec()
  }

  protected async getPublishingTaskInfo(id: string) {
    return await this.publishTaskModel.findOne({ _id: id }).exec()
  }

  protected async completePublishingTask(
    newData: PublishTask,
    dataId: string,
    data?: {
      workLink: string
      dataOption?: Record<string, any>
    },
  ) {
    newData.status = PublishStatus.PUBLISHED
    await this.publishTaskModel.updateOne(
      { _id: newData.id },
      { status: PublishStatus.PUBLISHED, dataId, workLink: data?.workLink },
    ).exec()
    await this.createPublishingRecord({
      ...newData,
      ...(data || {}),
      dataId,
    })
  }

  protected async failPublishingTask(id: string, errMsg: string) {
    await this.publishTaskModel.updateOne(
      { _id: id },
      { status: PublishStatus.FAILED, errorMsg: errMsg },
    ).exec()
  }

  protected generatePostMessage(publishTask: PublishTask): string {
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

  protected async processUploadMedia(
    publishTask: PublishTask,
    platform: string,
    category: PostCategory,
    subCategory: PostSubCategory,
    taskId: string,
  ): Promise<void> {
    await this.savePostMedia(publishTask, platform, category, subCategory, taskId)
    await this.publishPostMediaTask(publishTask.id, publishTask.queueId)
  }

  protected async savePostMedia(
    publishTask: PublishTask,
    platform: string,
    category: PostCategory,
    subCategory: PostSubCategory,
    taskId: string,
    status: PostMediaStatus = PostMediaStatus.CREATED,
  ): Promise<void> {
    await this.mediaStagingService.createMediaContainer({
      jobId: publishTask.queueId,
      accountId: publishTask.accountId,
      publishId: publishTask.id,
      userId: publishTask.userId,
      platform,
      taskId,
      status,
      category,
      subCategory,
    })
  }

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

  protected async getMediasProcessingStatus(
    task: PublishTask,
  ): Promise<MediaProcessingStatusResult> {
    const mediasStatus: MediaProcessingStatus[] = []
    let hasFailed = false
    const medias = await this.mediaStagingService.getMediaContainers(
      task.id,
      task.queueId,
    )
    if (!medias || medias.length === 0) {
      throw PublishingException.nonRetryable(`Media not found for task ID: ${task.id}`)
    }
    // check if all media files are processed
    let completedCount = 0
    for (const media of medias) {
      if (media.status === PostMediaStatus.FINISHED) {
        mediasStatus.push({ id: media.id, status: media.status, taskId: media.taskId, category: media.category })
        completedCount++
        continue
      }
      let status = PostMediaStatus.IN_PROGRESS
      const mediaStatus = await this.getMediaProcessingStatus(task.accountId, media.taskId)
      // if media processing failed, update the media status to failed and break the loop
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

  protected async createPublishRecord(newData: Partial<PublishRecord>) {
    newData.publishTime = newData.publishTime || new Date()
    await this.publishRecordService.createPublishRecord(newData)
  }

  async completePublishTask(
    newData: PublishTask,
    dataId: string,
    data?: {
      workLink: string
      dataOption?: Record<string, any>
    },
  ) {
    newData.status = PublishStatus.PUBLISHED
    await this.publishTaskModel.updateOne(
      { _id: newData.id },
      { status: PublishStatus.PUBLISHED, dataId, workLink: data?.workLink },
    ).exec()
    await this.createPublishRecord({
      ...newData,
      ...(data || {}),
      dataId,
    })
  }

  async updatePublishTaskStatus(id: string, status: PublishStatus, errMsg?: string) {
    await this.publishTaskModel.updateOne(
      { _id: id },
      { status, errorMsg: errMsg },
    ).exec()
  }

  async validatePublishParams(publishTask: CreatePublishDto): Promise<{
    success: boolean
    message?: string
  }> {
    if (!publishTask.accountType) {
      return {
        success: false,
        message: 'Account type is required',
      }
    }
    return {
      success: true,
      message: 'Publish params are valid',
    }
  }
}
