import { Injectable, Logger } from '@nestjs/common'
import { AppException, TableDto } from '@yikart/common'
import { AccountType, PublishStatus } from '@yikart/mongodb'
import { UserTaskService } from '../task/userTask.service'
import { EngagementNatsApi } from './api/engagement/engagement.natsApi'
import { PlatPublishNatsApi } from './api/publish.natsApi'
import { PublishTaskNatsApi } from './api/publishTask.natsApi'
import { PublishRecordItem } from './api/types/publish.interfaces'
import { NewPublishData, NewPublishRecordData, PlatOptions } from './common'
import { PostHistoryItemDto } from './dto/publish-response.dto'
import { PublishDayInfoListFiltersDto, PubRecordListFilterDto } from './dto/publish.dto'
import { FetchPostsResponseVo } from './engagement/dto/engagement.dto'

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name)
  constructor(
    private readonly platPublishNatsApi: PlatPublishNatsApi,
    private readonly publishTaskNatsApi: PublishTaskNatsApi,
    private readonly userTaskService: UserTaskService,
    private readonly engagementNatsApi: EngagementNatsApi,
  ) { }

  async create(newData: NewPublishData<PlatOptions>) {
    const res = await this.platPublishNatsApi.create(newData)
    return res
  }

  async createRecord(newData: NewPublishRecordData) {
    // 如果有用户ID任务，则传入用户任务ID和任务ID
    if (newData.userTaskId) {
      const userTask = await this.userTaskService.getUserTaskInfo(newData.userTaskId)
      if (userTask) {
        newData.taskId = userTask.taskId
      }
    }
    const res = await this.platPublishNatsApi.createRecord(newData)
    return res
  }

  async run(id: string) {
    const res = await this.platPublishNatsApi.run(id)
    return res
  }

  async getList(data: PubRecordListFilterDto, userId: string) {
    const list1 = await this.platPublishNatsApi.getPublishRecordList({
      ...data,
      userId,
    })
    const list2 = await this.publishTaskNatsApi.getPublishTaskList(userId, data)
    return [...list1, ...list2]
  }

  private mergePostHistory(publishRecords: PublishRecordItem[], publishTasks: any[], postsHistory: FetchPostsResponseVo) {
    const result = new Map<string, PostHistoryItemDto>()
    for (const post of postsHistory.posts) {
      result.set(post.postId, {
        id: post.postId,
        dataId: post.postId,
        flowId: '',
        type: post.mediaType,
        title: post.title || '',
        desc: post.content || '',
        accountId: '',
        accountType: post.platform as AccountType,
        uid: '',
        videoUrl: post.mediaType === 'video' ? post.permaLink || '' : undefined,
        coverUrl: post.thumbnail || undefined,
        imgUrlList: post.mediaType === 'image' ? [post.thumbnail || ''] : [],
        publishTime: new Date(post.publishTime),
        status: PublishStatus.PUBLISHED,
        errorMsg: '',
        engagement: {
          viewCount: post.viewCount,
          commentCount: post.commentCount,
          likeCount: post.likeCount,
          shareCount: post.shareCount,
          clickCount: post.clickCount,
          impressionCount: post.impressionCount,
          favoriteCount: post.favoriteCount,
        },
      })
    }
    const defaultEngagement = {
      viewCount: 0,
      commentCount: 0,
      likeCount: 0,
      shareCount: 0,
      clickCount: 0,
      impressionCount: 0,
      favoriteCount: 0,
    }

    for (const record of publishRecords) {
      if (record.dataId && result.has(record.dataId)) {
        const post = result.get(record.dataId)!
        post.flowId = record.flowId
        post.accountId = record.accountId
        post.accountType = record.accountType
        post.uid = record.uid
        post.errorMsg = record.errorMsg || ''
      }
      else {
        let status = record.status
        if (status === PublishStatus.PUBLISHING && record.publishTime > new Date()) {
          status = PublishStatus.PUBLISHED
        }
        result.set(record.dataId || record.id, {
          ...record,
          status,
          engagement: defaultEngagement,
        })
      }
    }
    for (const task of publishTasks) {
      result.set(task.dataId || task.id, {
        ...task,
        engagement: defaultEngagement,
      })
    }
    return Array.from(result.values()).sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime())
  }

  async getPostHistory(data: PubRecordListFilterDto, userId: string) {
    const publishRecords = await this.platPublishNatsApi.getPublishRecordList({
      ...data,
      userId,
    })
    const publishTasks = await this.publishTaskNatsApi.getPublishTaskList(userId, data)
    const range = { start: '', end: '' }
    if (data.time) {
      range.start = data.time[0].toISOString()
      range.end = data.time[1].toISOString()
    }
    const postsHistory = await this.engagementNatsApi.fetchChannelAllPosts({
      ...data,
      range,
      userId,
      platform: data.accountType as any,
    })
    return this.mergePostHistory(publishRecords, publishTasks, postsHistory)
  }

  async publishInfoData(userId: string) {
    const res = await this.platPublishNatsApi.getPublishInfoData(userId)
    return res
  }

  async publishDataInfoList(userId: string, data: PublishDayInfoListFiltersDto, page: TableDto) {
    return await this.platPublishNatsApi.publishDataInfoList(userId, data, page)
  }

  async getPublishRecordDetail(flowId: string, userId: string) {
    try {
      const record = await this.platPublishNatsApi.getPublishRecordDetail(flowId, userId)
      return record
    }
    catch (error: any) {
      this.logger.error(`Failed to get publish record detail for flowId ${flowId} and userId ${userId}: ${error.message}`, error.stack)
    }

    const task = await this.platPublishNatsApi.getPublishTaskDetail(flowId, userId)
    if (!task) {
      throw new AppException(400, `publish record with flowId ${flowId} not found.`)
    }
    return task
  }
}
