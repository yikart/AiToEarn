import { Inject, Injectable, Logger } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { AccountType, PublishStatus } from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode } from '@yikart/common'
import { PublishRecord, PublishType } from '@yikart/mongodb'
import { youtube_v3 } from 'googleapis'
import { v4 as uuidv4 } from 'uuid'
import { PublishRecordService } from '../../publish-record/publish-record.service'
import { RelayAccountException } from '../../relay/relay-account.exception'
import { DouyinDownloadType, DouyinPrivateStatus } from '../libs/douyin/common'
import { ChannelAccountService } from '../platforms/channel-account.service'
import { FacebookService } from '../platforms/meta/facebook.service'
import { YoutubeService } from '../platforms/youtube/youtube.service'
import { BilibiliWebhookDto } from './bilibili-webhook.dto'
import { IMMEDIATE_PUBLISH_TOLERANCE_SECONDS } from './constant'
import { DouyinWebhookDto } from './douyin-webhook.dto'
import { PublishService } from './providers/base.service'
import { BilibiliPubService } from './providers/bilibili.service'
import { DouyinPubService } from './providers/douyin.service'
import { TiktokPubService } from './providers/tiktok.service'
import { CreatePublishDto, PublishRecordListFilterDto, UpdatePublishTaskDto } from './publish.dto'
import { TiktokWebhookDto } from './tiktok-webhook.dto'
import { generatePostMessage } from './util'

/**
 * 发布服务
 * 负责管理内容发布任务的创建、更新、删除和执行
 * 支持多平台发布：TikTok、Bilibili、抖音、YouTube、Facebook、Instagram
 */
@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name)

  constructor(
    private readonly channelAccountService: ChannelAccountService,
    private readonly queueService: QueueService,
    private readonly tiktokPubService: TiktokPubService,
    private readonly bilibiliPubService: BilibiliPubService,
    private readonly douyinPubService: DouyinPubService,
    private readonly youtubeService: YoutubeService,
    private readonly facebookService: FacebookService,
    @Inject('PUBLISHING_PROVIDERS')
    private readonly publishingProviders: Record<AccountType, PublishService>,
    private readonly publishRecordService: PublishRecordService,
  ) { }

  /**
   * 确定 Meta 平台（Facebook/Instagram）的发布类型
   * Facebook 默认为 post，Instagram 根据是否有视频决定是 post 还是 reel
   */
  private determineMetaPostCategory(data: CreatePublishDto) {
    switch (data.accountType) {
      case AccountType.FACEBOOK:
        if (!data.option || !data.option.facebook || !data.option.facebook.content_category) {
          data.option = {
            ...data.option,
            facebook: {
              ...data.option?.facebook,
              content_category: 'post',
            },
          }
        }
        break
      case AccountType.INSTAGRAM: {
        if (!data.option || !data.option.instagram || !data.option.instagram.content_category) {
          let category = 'post'
          if (data.videoUrl) {
            category = 'reel'
          }
          data.option = {
            ...data.option,
            instagram: {
              ...data.option?.instagram,
              content_category: category,
            },
          }
        }
        break
      }
    }
  }

  /**
   * 创建发布任务
   * 1. 验证发布参数
   * 2. 检查 flowId 是否重复
   * 3. 处理 Meta 平台特殊逻辑
   * 4. 抖音平台立即发布，其他平台根据发布时间决定是否入队
   */
  async createPublishingTask(publishData: CreatePublishDto) {
    // 发布参数验证
    const validateResult = await this.publishingProviders[publishData.accountType].validatePublishParams(publishData)
    if (!validateResult.success) {
      throw new AppException(ResponseCode.PublishTaskInvalid, validateResult.message)
    }

    if (publishData.flowId) {
      const isTaskExists = await this.publishRecordService.getByFlowId(publishData.flowId)
      if (isTaskExists) {
        throw new AppException(ResponseCode.ChannelPublishTaskAlreadyExists, `flowId ${publishData.flowId} 的发布任务已存在`)
      }
    }

    // mate系处理
    if ([AccountType.FACEBOOK, AccountType.INSTAGRAM].includes(publishData.accountType)) {
      this.determineMetaPostCategory(publishData)
    }
    publishData.publishTime = new Date(publishData.publishTime)

    const accountInfo = await this.channelAccountService.getAccountInfo(
      publishData.accountId,
    )
    if (!accountInfo)
      throw new AppException(ResponseCode.ChannelAccountInfoFailed)

    if (accountInfo.relayAccountRef) {
      throw new RelayAccountException(accountInfo.relayAccountRef, publishData.accountId)
    }

    const { publishTime, accountType } = publishData
    const taskData = {
      ...publishData,
      queueId: `publish:${accountType}:${uuidv4()}`,
      uid: accountInfo.uid,
      userId: accountInfo.userId,
    }
    // 创建发布记录
    const newTask = await this.publishRecordService.createPublishRecord(taskData)

    // 抖音单独处理
    if (publishData.accountType === AccountType.Douyin) {
      const res = await this.publishingProviders[publishData.accountType].immediatePublish(newTask)
      return {
        accountType: publishData.accountType,
        ...res,
      }
    }

    const now = Date.now()
    const immediatePublishWindow = [
      now - IMMEDIATE_PUBLISH_TOLERANCE_SECONDS,
      now + IMMEDIATE_PUBLISH_TOLERANCE_SECONDS,
    ]
    const publishImmediately = publishTime.getTime() <= immediatePublishWindow[1]
    if (!publishImmediately) {
      this.logger.log(`发布任务 ${newTask.id} 已创建，计划发布时间 ${publishTime.toISOString()}`)
      return newTask
    }

    // 发布任务推入队列
    const res = await this.enqueuePublishingTask(newTask)
    if (!res)
      throw new AppException(ResponseCode.PublishTaskFailed, { accountType })
    this.logger.log(`发布任务 ${newTask.id} 已创建并立即推入队列`)
    return newTask
  }

  /**
   * 更新已发布的 Facebook 帖子
   * 仅支持更新帖子文案和话题
   */
  async updatePublishedFacebookTask(publishTask: PublishRecord) {
    if (!publishTask.accountId) {
      return false
    }
    const message = generatePostMessage(publishTask.desc || '', publishTask.topics || [])
    const result = await this.facebookService.updatePost(publishTask.accountId, publishTask.dataId || '', { message })
    return result.success
  }

  /**
   * 更新已发布的 YouTube 视频
   * 支持更新标题、描述、标签、分类、隐私状态等
   */
  async updatePublishedYoutubePost(publishTask: PublishRecord) {
    if (!publishTask.accountId) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    const videoSchema: youtube_v3.Schema$Video = {
      id: publishTask.dataId,
      snippet: {
        title: publishTask.title,
        description: publishTask.desc,
        tags: publishTask.topics,
        categoryId: publishTask.option?.youtube?.categoryId,
      },
      status: {
        privacyStatus: publishTask.option?.youtube?.privacyStatus,
        selfDeclaredMadeForKids: publishTask.option?.youtube?.selfDeclaredMadeForKids,
        embeddable: publishTask.option?.youtube?.embeddable,
        license: publishTask.option?.youtube?.license,
      },
    }
    return await this.youtubeService.updateVideo(publishTask.accountId, videoSchema)
  }

  /**
   * 更新已发布的文本内容
   * 根据平台类型调用对应的更新方法
   * 目前仅支持 YouTube 和 Facebook
   */
  async updatePublishedTextTask(publishTask: PublishRecord) {
    if (publishTask.accountType === AccountType.YOUTUBE) {
      return await this.updatePublishedYoutubePost(publishTask)
    }
    else if (publishTask.accountType === AccountType.FACEBOOK) {
      return await this.updatePublishedFacebookTask(publishTask)
    }
    throw new AppException(ResponseCode.PlatformNotSupported, '仅支持 Facebook 和 YouTube 更新')
  }

  /**
   * 更新发布任务
   * 支持更新已发布内容的文案、视频、图片等
   * 仅支持 Facebook 和 YouTube 平台
   */
  async updatePublishingTask(data: UpdatePublishTaskDto) {
    const supportPlatforms = [AccountType.FACEBOOK, AccountType.YOUTUBE]
    const task = await this.publishRecordService.getById(data.id)
    if (!task || task.userId !== data.userId) {
      throw new AppException(ResponseCode.PublishTaskNotFound)
    }
    if (task.status !== PublishStatus.PUBLISHED) {
      throw new AppException(ResponseCode.PublishTaskNotPublished)
    }

    if (task.accountId) {
      const account = await this.channelAccountService.getAccountInfo(task.accountId)
      if (account?.relayAccountRef) {
        throw new RelayAccountException(account.relayAccountRef, task.accountId)
      }
    }

    if (!supportPlatforms.includes(task.accountType)) {
      throw new AppException(ResponseCode.PlatformNotSupported, '仅支持 Facebook 和 YouTube 平台更新')
    }

    if (task.option && task.option.facebook) {
      if (task.option.facebook.content_category !== 'post') {
        throw new AppException(ResponseCode.PostCategoryNotSupported, 'Facebook 仅支持 post 类型')
      }
    }
    let updatedContentType = 'text'
    if (data.videoUrl) {
      updatedContentType = 'video'
    }
    else if (data.imgUrlList) {
      updatedContentType = 'image'
    }
    try {
      if (updatedContentType === 'text') {
        return await this.updatePublishedTextTask(task)
      }
      await this.publishRecordService.updateById(data.id, {
        desc: data.desc,
        videoUrl: data.videoUrl,
        imgUrlList: data.imgUrlList,
        topics: data.topics,
        status: PublishStatus.WAITING_FOR_UPDATE,
        option: data.option,
      })
      await this.enqueueUpdatePublishedPostTask(task, updatedContentType)
      return true
    }
    catch (error) {
      throw new AppException(ResponseCode.PublishTaskUpdateFailed, (error as Error).message)
    }
  }

  /**
   * 将发布任务加入消息队列
   * 支持重试机制：最多 3 次，指数退避
   */
  async enqueuePublishingTask(task: PublishRecord): Promise<boolean> {
    const jobId = uuidv4().toString()
    await this.publishRecordService.updateById(task.id, { queueId: jobId })
    const jobRes = await this.queueService.addPostPublishJob(
      {
        taskId: task.id,
        jobId,
        attempts: 0,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5,
        },
        removeOnComplete: true,
        removeOnFail: true,
        jobId,
      },
    )
    return jobRes.id === jobId
  }

  /**
   * 将已发布内容的更新任务加入消息队列
   * 用于更新已发布帖子的视频或图片内容
   */
  async enqueueUpdatePublishedPostTask(task: PublishRecord, updatedContentType: string): Promise<boolean> {
    const jobId = uuidv4().toString()
    await this.publishRecordService.updateById(task.id, { queueId: jobId })
    const jobRes = await this.queueService.addUpdatePublishedPostJob(
      {
        taskId: task.id,
        updatedContentType,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5,
        },
        removeOnComplete: true,
        removeOnFail: true,
        jobId,
      },
    )
    return jobRes.id === jobId
  }

  /**
   * 根据时间获取待发布任务列表
   * 用于定时任务扫描需要执行的发布任务
   */
  async getPublishTaskListByTime(end: Date): Promise<PublishRecord[]> {
    return this.publishRecordService.listByTime(end)
  }

  /**
   * 根据筛选条件获取发布任务列表
   */
  async getPublishTasks(
    query: PublishRecordListFilterDto,
  ): Promise<PublishRecord[]> {
    return this.publishRecordService.listPublishTasks(query)
  }

  /**
   * 获取已入队的发布任务列表
   */
  async getQueuedPublishTasks(query: {
    userId: string
    accountId?: string
    accountType?: AccountType
    time?: [Date?, Date?, ...unknown[]]
  }): Promise<PublishRecord[]> {
    return await this.publishRecordService.listQueuedPublishTasks(query)
  }

  /**
   * 获取已发布的任务列表
   */
  async getPublishedPublishTasks(query: {
    userId: string
    accountId?: string
    accountType?: AccountType
    time?: [Date?, Date?, ...unknown[]]
  }): Promise<PublishRecord[]> {
    return await this.publishRecordService.listPublishedPublishTasks(query)
  }

  /**
   * 根据 flowId 获取发布任务列表
   */
  async getPublishTaskListByFlowId(
    flowId: string,
  ): Promise<PublishRecord[]> {
    return await this.publishRecordService.listByFlowId(flowId)
  }

  /**
   * 更新发布任务状态
   * @param id 任务 ID
   * @param newData 新状态数据
   */
  async updatePublishTaskStatus(
    id: string,
    newData: {
      errorMsg?: string
      status: PublishStatus
      publishTime?: Date
      queued?: boolean
      inQueue?: boolean
    },
  ): Promise<boolean> {
    this.logger.debug({ path: 'updatePublishTaskStatus', id, newData })
    return await this.publishRecordService.updateTaskStatus(id, newData)
  }

  /**
   * 标记任务为发布中状态
   * @param taskId 任务 ID
   * @param dataId 平台返回的数据 ID
   * @param workLink 作品链接（可选）
   */
  async markTaskAsPublishing(taskId: string, dataId: string, workLink?: string): Promise<boolean> {
    return await this.publishRecordService.updateAsPublishing(taskId, dataId, workLink)
  }

  /**
   * 删除队列中的任务
   * 仅支持删除等待中或延迟状态的任务
   */
  async deleteQueueTask(queueId: string) {
    const job = await this.queueService.getPostPublishJob(queueId)
    if (!job) {
      throw new AppException(ResponseCode.PublishTaskNotFound)
    }
    const state = await job.getState()
    if (state === 'waiting' || state === 'delayed') {
      await job.remove()
    }
    else {
      throw new AppException(ResponseCode.PublishTaskInProgress)
    }
  }

  /**
   * 根据 ID 删除发布任务
   * 如果任务已入队，会同时从队列中移除
   */
  async deletePublishTaskById(id: string, userId: string): Promise<boolean> {
    const task = await this.publishRecordService.getOneById(id)
    if (!task || task.userId !== userId) {
      throw new AppException(ResponseCode.PublishTaskNotFound)
    }
    if (task.accountId) {
      const account = await this.channelAccountService.getAccountInfo(task.accountId)
      if (account?.relayAccountRef) {
        throw new RelayAccountException(account.relayAccountRef, task.accountId)
      }
    }
    if (task.queued && !!task.queueId) {
      await this.deleteQueueTask(task.queueId)
    }

    const res = await this.publishRecordService.deleteById(id)
    return res
  }

  /**
   * 更新发布任务的发布时间
   * 如果任务已在队列中，会先从队列移除
   */
  async updatePublishTaskTime(id: string, publishTime: Date, userId: string) {
    const task = await this.publishRecordService.getOneById(id)
    if (!task || task.userId !== userId) {
      throw new AppException(ResponseCode.PublishTaskNotFound)
    }
    if (task.accountId) {
      const account = await this.channelAccountService.getAccountInfo(task.accountId)
      if (account?.relayAccountRef) {
        throw new RelayAccountException(account.relayAccountRef, task.accountId)
      }
    }

    await this.publishRecordService.updateById(
      id,
      { publishTime },
    )
    if (task.inQueue && !!task.queueId) {
      await this.deleteQueueTask(task.queueId)
    }
    return true
  }

  /**
   * 根据 ID 获取发布任务详情
   */
  async getPublishTaskInfo(id: string) {
    return await this.publishRecordService.getOneById(id)
  }

  /**
   * 根据 flowId 和 userId 获取发布任务详情
   */
  async getPublishTaskInfoWithFlowId(flowId: string, userId: string) {
    return await this.publishRecordService.getTaskInfoWithFlowId(flowId, userId)
  }

  /**
   * 根据任务 ID 和 userId 获取发布任务详情
   */
  async getPublishTaskInfoWithUserId(id: string, userId: string) {
    return await this.publishRecordService.getTaskInfoWithUserId(id, userId)
  }

  /**
   * 立即发布任务
   * 将等待发布的任务立即加入队列执行
   */
  async publishTaskImmediately(id: string) {
    const taskDoc = await this.getPublishTaskInfo(id)
    const taskInfo = taskDoc!
    if (!taskInfo) {
      throw new AppException(ResponseCode.PublishTaskNotFound)
    }
    if (taskInfo.status !== PublishStatus.WaitingForPublish) {
      throw new AppException(ResponseCode.PublishTaskStatusInvalid)
    }

    if (taskInfo.accountId) {
      const account = await this.channelAccountService.getAccountInfo(taskInfo.accountId)
      if (account?.relayAccountRef) {
        throw new RelayAccountException(account.relayAccountRef, taskInfo.accountId)
      }
    }

    await this.publishRecordService.updateById(id, { publishTime: new Date(), queued: true })
    await this.enqueuePublishingTask(taskInfo)
  }

  /**
   * 处理 TikTok 发布回调
   * 接收 TikTok 平台的发布状态通知
   */
  async handleTiktokPostWebhook(data: TiktokWebhookDto) {
    return this.tiktokPubService.handleTiktokPostWebhook(data)
  }

  /**
   * 处理 Bilibili 发布回调
   * 接收 Bilibili 平台的发布状态通知
   */
  async handleBilibiliPublishWebhook(data: BilibiliWebhookDto) {
    return this.bilibiliPubService.handleBilibiliPublishWebhook(data)
  }

  /**
   * 处理抖音发布回调
   * 接收抖音平台的发布状态通知
   */
  async handleDouyinPublishWebhook(data: DouyinWebhookDto) {
    return this.douyinPubService.handleDouyinPublishWebhook(data)
  }

  async createDouyinPublishing(data: { desc?: string, title?: string, topics: string[], videoUrl?: string, imgUrlList?: string[] }): Promise<{ permalink: string }> {
    return this.douyinPubService.doPublish(data, {
      downloadType: DouyinDownloadType.Allow,
      privateStatus: DouyinPrivateStatus.All,
    })
  }

  /**
   * 创建发布记录
   * 记录发布成功的内容信息
   */
  async createPublishRecord(newData: Partial<PublishRecord>) {
    const publishRecord: Partial<PublishRecord> = {
      ...newData,
      publishTime: newData.publishTime || new Date(),
      type: PublishType.VIDEO,
    }

    if (publishRecord.accountId && (!publishRecord.uid || !publishRecord.userId || !publishRecord.accountType)) {
      const account = await this.channelAccountService.getAccountInfo(publishRecord.accountId)
      if (!account) {
        throw new AppException(ResponseCode.ChannelAccountInfoFailed)
      }

      publishRecord.uid = publishRecord.uid || account.uid
      publishRecord.userId = publishRecord.userId || account.userId
      publishRecord.accountType = publishRecord.accountType || account.type
    }

    return this.publishRecordService.createPublishRecord(publishRecord)
  }
}
