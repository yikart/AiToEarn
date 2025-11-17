import { Injectable, Logger } from '@nestjs/common'
import { AccountType, AppException, ResponseCode, TableDto } from '@yikart/common'
import { PublishedPost, PublishRecord, PublishStatus } from '@yikart/mongodb'
import { z } from 'zod'
import { PublishRecordService } from '../publishRecord/publishRecord.service'
import { PlatPublishNatsApi } from '../transports/channel/api/publish.natsApi'
import { PublishTaskNatsApi } from '../transports/channel/api/publishTask.natsApi'
import { ChannelApi } from '../transports/channel/channel.api'
import { PublishingChannel } from '../transports/channel/common'
import { NewPublishData, NewPublishRecordData, PlatOptions } from './common'
import { PostHistoryItemVoSchema } from './dto/publish-response.vo'
import { PublishDayInfoListFiltersDto, PubRecordListFilterDto } from './dto/publish.dto'
import { PostService } from './post/post.service'

type PostHistoryItem = z.infer<typeof PostHistoryItemVoSchema>

@Injectable()
export class PublishService {
  private readonly logger = new Logger(PublishService.name)
  constructor(
    private readonly publishTaskNatsApi: PublishTaskNatsApi,
    private readonly publishRecordService: PublishRecordService,
    private readonly postService: PostService,
    private readonly platPublishNatsApi: PlatPublishNatsApi,
    private readonly channelApi: ChannelApi,
  ) { }

  async create(newData: NewPublishData<PlatOptions>) {
    const res = await this.platPublishNatsApi.create(newData)
    return res
  }

  async createRecord(newData: NewPublishRecordData) {
    const res = await this.publishRecordService.createPublishRecord(newData)
    return res
  }

  async run(id: string) {
    const res = await this.platPublishNatsApi.run(id)
    return res
  }

  async getList(data: PubRecordListFilterDto, userId: string) {
    const list1 = await this.publishRecordService.getPublishRecordList({
      ...data,
      userId,
    })
    const list2 = await this.publishTaskNatsApi.getPublishTaskList(userId, data)
    return [...list1, ...list2]
  }

  private mergePostHistory(publishRecords: PublishRecord[], publishTasks: any[], postsHistory: PublishedPost[]) {
    const result = new Map<string, PostHistoryItem>()

    // Create an index of postsHistory for easy lookup of engagement data by postId
    const postsHistoryMap = new Map<string, PublishedPost>()
    for (const post of postsHistory) {
      postsHistoryMap.set(post.postId, post)
      result.set(post.postId, {
        id: post.id,
        dataId: post.postId,
        flowId: '',
        type: '',
        title: post.title || '',
        desc: post.desc || '',
        accountId: post.accountId || '',
        accountType: post.platform as AccountType,
        uid: '',
        videoUrl: post.medias.find(media => media.type === 'video')?.url || '',
        coverUrl: post.medias.find(media => media.type === 'image')?.url || '',
        imgUrlList: post.medias.filter(media => media.type === 'image').map(media => media.url),
        publishTime: new Date(post.publishTime),
        status: PublishStatus.PUBLISHED,
        errorMsg: '',
        publishingChannel: PublishingChannel.NATIVE,
        workLink: post.permalink || '',
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

    const publishRecordCache = new Map<string, PublishRecord>()
    for (const record of publishRecords) {
      if (record.flowId) {
        publishRecordCache.set(record.flowId, record)
      }
      if (record.dataId && result.has(record.dataId)) {
        const post = result.get(record.dataId)!
        post.id = record.id
        post.title = record.title || ''
        post.desc = record.desc || ''
        post.flowId = record.flowId || ''
        post.accountId = record.accountId
        post.accountType = record.accountType
        post.uid = record.uid
        post.errorMsg = record.errorMsg || ''
        post.publishingChannel = PublishingChannel.INTERNAL
        if (record.workLink) {
          post.workLink = record.workLink
        }
        // Keep the original engagement (from postsHistory)
      }
      else {
        let status = record.status
        if (status === PublishStatus.PUBLISHING && record.publishTime > new Date()) {
          status = PublishStatus.PUBLISHED
        }

        // Try to get engagement data from postsHistoryMap
        const engagementData = record.dataId && postsHistoryMap.has(record.dataId)
          ? {
              viewCount: postsHistoryMap.get(record.dataId)!.viewCount,
              commentCount: postsHistoryMap.get(record.dataId)!.commentCount,
              likeCount: postsHistoryMap.get(record.dataId)!.likeCount,
              shareCount: postsHistoryMap.get(record.dataId)!.shareCount,
              clickCount: postsHistoryMap.get(record.dataId)!.clickCount,
              impressionCount: postsHistoryMap.get(record.dataId)!.impressionCount,
              favoriteCount: postsHistoryMap.get(record.dataId)!.favoriteCount,
            }
          : defaultEngagement

        result.set(record.dataId || record.id, {
          id: record.id,
          flowId: record.flowId || '',
          title: record.title || '',
          desc: record.desc || '',
          dataId: record.dataId,
          type: record.type,
          accountId: record.accountId,
          accountType: record.accountType,
          uid: record.uid,
          videoUrl: record.videoUrl || '',
          coverUrl: record.coverUrl || '',
          imgUrlList: record.imgUrlList || [],
          publishTime: record.publishTime,
          errorMsg: record.errorMsg || '',
          status,
          engagement: engagementData,
          publishingChannel: PublishingChannel.INTERNAL,
          workLink: record.workLink || '',
        })
      }
    }
    for (const task of publishTasks) {
      if (task.flowId && !publishRecordCache.has(task.flowId)) {
        // Try to get engagement data from postsHistoryMap
        const engagementData = task.dataId && postsHistoryMap.has(task.dataId)
          ? {
              viewCount: postsHistoryMap.get(task.dataId)!.viewCount,
              commentCount: postsHistoryMap.get(task.dataId)!.commentCount,
              likeCount: postsHistoryMap.get(task.dataId)!.likeCount,
              shareCount: postsHistoryMap.get(task.dataId)!.shareCount,
              clickCount: postsHistoryMap.get(task.dataId)!.clickCount,
              impressionCount: postsHistoryMap.get(task.dataId)!.impressionCount,
              favoriteCount: postsHistoryMap.get(task.dataId)!.favoriteCount,
            }
          : defaultEngagement

        result.set(task.dataId || task.id, {
          id: task.id,
          ...task,
          engagement: engagementData,
          publishingChannel: PublishingChannel.INTERNAL,
        })
      }
    }
    return Array.from(result.values()).sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime())
  }

  async getPostHistory(data: PubRecordListFilterDto, userId: string) {
    const publishRecords = await this.publishRecordService.getPublishRecordList({
      ...data,
      userId,
    })
    const publishTasks = await this.publishTaskNatsApi.getPublishTaskList(userId, data)
    const publishedPosts = await this.postService.getUserAllPostsByPlatform({
      ...data,
      period: data.time,
      userId,
      platform: data.accountType,
    })
    const posts = this.mergePostHistory(publishRecords, publishTasks, publishedPosts)
    if (data.publishingChannel) {
      return posts.filter(post => post.publishingChannel === data.publishingChannel)
    }
    return posts
  }

  async getQueuedPublishingTasks(data: PubRecordListFilterDto, userId: string) {
    const publishTasks = await this.publishTaskNatsApi.getQueuedPublishTasks(userId, data)
    const posts = this.mergePostHistory([], publishTasks, [])
    return posts
  }

  async getPublishedPosts(data: PubRecordListFilterDto, userId: string) {
    const publishRecords = await this.publishRecordService.getPublishRecordList({
      ...data,
      userId,
    })
    const publishTasks = await this.publishTaskNatsApi.getPublishedPublishTasks(userId, data)
    const publishedPosts = await this.postService.getUserAllPostsByPlatform({
      ...data,
      period: data.time,
      userId,
      platform: data.accountType as any,
    })
    const posts = this.mergePostHistory(publishRecords, publishTasks, publishedPosts)
    return posts
  }

  async publishInfoData(userId: string) {
    const res = await this.publishRecordService.getPublishInfoData(userId)
    return res
  }

  async publishDataInfoList(userId: string, data: PublishDayInfoListFiltersDto, page: TableDto) {
    return await this.publishRecordService.getPublishDayInfoList({ userId, time: data.time }, page)
  }

  async getPublishRecordDetail(flowId: string, userId: string) {
    try {
      const record = await this.publishRecordService.getPublishRecordDetail({ flowId, userId })
      return record
    }
    catch (error: any) {
      this.logger.error(`Failed to get publish record detail for flowId ${flowId} and userId ${userId}: ${error.message}`, error.stack)
    }

    const task = await this.channelApi.getPublishTaskInfoWithFlowId({ flowId, userId })
    if (!task) {
      throw new AppException(ResponseCode.PublishRecordNotFound, { flowId })
    }
    return task
  }
}
