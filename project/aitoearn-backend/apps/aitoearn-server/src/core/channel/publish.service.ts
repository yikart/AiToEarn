import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { AppException, getErrorDetail, ResponseCode, TableDto } from '@yikart/common'
import { PublishRecord } from '@yikart/mongodb'
import { z } from 'zod'
import { PublishRecordService } from '../publish-record/publish-record.service'
import { PublishingChannel } from './channel.interfaces'
import { NewPublishData, PlatOptions } from './common'
import { PostHistoryItemVoSchema } from './publish-response.vo'
import { PublishDayInfoListFiltersDto, PubRecordListFilterDto, UpdatePublishTaskDto } from './publish.dto'
import { CreatePublishDto, UpdatePublishTaskDto as PublishingUpdatePublishTaskDto } from './publishing/publish.dto'
import { PublishingService } from './publishing/publishing.service'

type PostHistoryItem = z.infer<typeof PostHistoryItemVoSchema>

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name)
  constructor(
    private readonly publishingService: PublishingService,
    private readonly publishRecordService: PublishRecordService,
    private readonly assetsService: AssetsService,
  ) { }

  private toCreatePublishDto(newData: NewPublishData<PlatOptions>): CreatePublishDto {
    return {
      flowId: newData.flowId,
      accountId: newData.accountId,
      accountType: newData.accountType,
      type: newData.type,
      title: newData.title,
      desc: newData.desc,
      userTaskId: newData.userTaskId,
      videoUrl: newData.videoUrl,
      coverUrl: newData.coverUrl,
      imgUrlList: newData.imgUrlList,
      publishTime: newData.publishTime || new Date(),
      topics: newData.topics || [],
      option: newData.option,
    } as CreatePublishDto
  }

  /**
   * 公开的发布接口
   * @param newData
   * @returns
   */
  async pubCreate(newData: NewPublishData<PlatOptions>) {
    const res = await this.publishingService.createPublishingTask(this.toCreatePublishDto(newData))
    return res
  }

  async create(userId: string, newData: NewPublishData<PlatOptions>) {
    const res = await this.publishingService.createPublishingTask(this.toCreatePublishDto(newData))
    return res
  }

  async run(id: string) {
    const res = await this.publishingService.publishTaskImmediately(id)
    return res
  }

  async getList(data: PubRecordListFilterDto, userId: string) {
    const res = await this.publishRecordService.getPublishRecordList({
      ...data,
      userId,
    })
    return res
  }

  /**
   * 从 snapshot 作品数据中提取互动统计和更新时间
   */
  private getDefaultEngagement() {
    return {
      viewCount: 0,
      commentCount: 0,
      likeCount: 0,
      shareCount: 0,
      clickCount: 0,
      impressionCount: 0,
      favoriteCount: 0,
    }
  }

  private mergePostHistory(publishRecords: PublishRecord[], publishTasks: any[]) {
    const result = new Map<string, PostHistoryItem>()

    // 以发布记录为主
    const publishRecordCache = new Map<string, PublishRecord>()
    for (const record of publishRecords) {
      if (record.coverUrl) {
        record.coverUrl = this.assetsService.buildUrl(record.coverUrl)
      }
      if (record.flowId) {
        publishRecordCache.set(record.flowId, record)
      }
      const engagement = this.getDefaultEngagement()
      result.set(record.dataId || record.id, {
        id: record.id,
        flowId: record.flowId || '',
        title: record.title || '',
        desc: record.desc || '',
        dataId: record.dataId,
        type: record.type,
        accountId: record.accountId ?? '',
        accountType: record.accountType,
        uid: record.uid,
        videoUrl: record.videoUrl || '',
        coverUrl: record.coverUrl || '',
        imgUrlList: record.imgUrlList || [],
        publishTime: record.publishTime,
        errorMsg: record.errorMsg || '',
        status: record.status,
        engagement,
        publishingChannel: PublishingChannel.INTERNAL,
        workLink: record.workLink || '',
        topics: record.topics || [],
        updatedAt: record.updatedAt,
      })
    }

    for (const task of publishTasks) {
      if (task.coverUrl) {
        task.coverUrl = this.assetsService.buildUrl(task.coverUrl)
      }
      if (task.flowId && publishRecordCache.has(task.flowId)) {
        continue
      }

      const taskKey = task.dataId || task.id
      if (result.has(taskKey)) {
        const existingPost = result.get(taskKey)!
        if (task.flowId && !existingPost.flowId) {
          existingPost.flowId = task.flowId
        }
        continue
      }

      const engagement = this.getDefaultEngagement()
      result.set(taskKey, {
        id: task.id,
        flowId: task.flowId || '',
        title: task.title || '',
        desc: task.desc || '',
        dataId: task.dataId,
        type: task.type,
        accountId: task.accountId ?? '',
        accountType: task.accountType,
        uid: task.uid,
        videoUrl: task.videoUrl || '',
        coverUrl: task.coverUrl || '',
        imgUrlList: task.imgUrlList || [],
        publishTime: task.publishTime,
        errorMsg: task.errorMsg || '',
        status: task.status,
        engagement,
        publishingChannel: PublishingChannel.INTERNAL,
        workLink: task.workLink || '',
        topics: task.topics || [],
        updatedAt: task.updatedAt,
      })
    }

    return Array.from(result.values()).sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime())
  }

  async getPostHistory(data: PubRecordListFilterDto, userId: string) {
    const [publishRecords, publishTasks] = await Promise.all([
      this.publishRecordService.getPublishRecordList({ ...data, userId }),
      this.publishingService.getPublishTasks({ userId, ...data }),
    ])

    const posts = this.mergePostHistory(publishRecords, publishTasks)
    if (data.publishingChannel) {
      return posts.filter(post => post.publishingChannel === data.publishingChannel)
    }
    return posts
  }

  async getQueuedPublishingTasks(data: PubRecordListFilterDto, userId: string) {
    const publishTasks = await this.publishingService.getQueuedPublishTasks({ userId, ...data })
    const posts = this.mergePostHistory([], publishTasks)
    return posts
  }

  async getPublishedPosts(data: PubRecordListFilterDto, userId: string) {
    const [publishRecords, publishTasks] = await Promise.all([
      this.publishRecordService.getPublishRecordList({ ...data, userId }),
      this.publishingService.getPublishedPublishTasks({ userId, ...data }),
    ])

    const posts = this.mergePostHistory(publishRecords, publishTasks)
    return posts
  }

  async publishInfoData(userId: string) {
    const res = await this.publishRecordService.getPublishInfoData(userId)
    return res
  }

  async publishDataInfoList(userId: string, data: PublishDayInfoListFiltersDto, page: TableDto) {
    return await this.publishRecordService.getPublishDayInfoList({ userId, time: data.time }, page)
  }

  /**
   * Get publish task list of flow id
   * @param flowId
   * @param userId
   * @returns
   */
  async getPublishTaskListOfFlowId(flowId: string, userId: string) {
    const tasks = await this.publishingService.getPublishTasks({ userId, flowId })
    return tasks
  }

  async getPublishRecordDetail(flowId: string, userId: string) {
    try {
      const record = await this.publishRecordService.getPublishRecordDetail({ flowId, userId })
      if (record) {
        return record
      }
    }
    catch (error: any) {
      this.logger.error(`Failed to get publish record detail for flowId ${flowId} and userId ${userId}: ${error.message}`, error.stack)
    }

    const task = await this.publishingService.getPublishTaskInfoWithFlowId(flowId, userId)
    if (!task) {
      throw new AppException(ResponseCode.PublishRecordNotFound)
    }
    return task
  }

  async updatePublishTask(data: UpdatePublishTaskDto, userId: string) {
    try {
      const publishingData: PublishingUpdatePublishTaskDto = { ...data, userId }
      const success = await this.publishingService.updatePublishingTask(publishingData)
      return { success }
    }
    catch (error: unknown) {
      const { message: errorMessage, stack: errorStack } = getErrorDetail(error)
      this.logger.error(`Failed to update publish task for userId ${userId}: ${errorMessage}`, errorStack)
      throw new AppException(ResponseCode.PublishTaskUpdateFailed, errorMessage)
    }
  }
}
