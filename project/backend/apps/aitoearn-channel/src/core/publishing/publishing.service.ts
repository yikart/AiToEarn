import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { QueueService } from '@yikart/aitoearn-queue'
import { AccountType, PublishRecord, PublishStatus } from '@yikart/aitoearn-server-client'
import { AppException, ResponseCode } from '@yikart/common'
import { Model, RootFilterQuery } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { PublishTask } from '../../libs/database/schema/publishTask.schema'
import { AccountService } from '../account/account.service'
import { PublishRecordService } from '../account/publish-record.service'
import { IMMEDIATE_PUBLISH_TOLERANCE_SECONDS } from './constant'
import { CreatePublishDto, PublishRecordListFilterDto, UpdatePublishTaskDto } from './dto/publish.dto'
import { TiktokWebhookDto } from './dto/tiktok-webhook.dto'
import { TiktokPubService } from './providers/tiktok.service'

@Injectable()
export class PublishingService implements OnModuleDestroy {
  private readonly logger = new Logger(PublishingService.name)

  constructor(
    private readonly accountService: AccountService,
    private readonly queueService: QueueService,
    private readonly tiktokPubService: TiktokPubService,
    @InjectModel(PublishTask.name)
    private readonly publishTaskModel: Model<PublishTask>,
    private readonly publishRecordService: PublishRecordService,
  ) {}

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

  async createPublishingTask(taskInfo: CreatePublishDto) {
    const isTaskExists = await this.publishTaskModel.findOne({
      flowId: taskInfo.flowId,
    })
    if (isTaskExists) {
      throw new AppException(ResponseCode.ChannelPublishTaskAlreadyExists, `publish task with flowId ${taskInfo.flowId} already exists`)
    }
    const metaPlatforms = [AccountType.FACEBOOK, AccountType.INSTAGRAM]
    if (metaPlatforms.includes(taskInfo.accountType)) {
      this.determineMetaPostCategory(taskInfo)
    }
    this.logger.log(`Creating publish task with data: ${JSON.stringify(taskInfo)}`)
    taskInfo.publishTime = new Date(taskInfo.publishTime)

    const accountInfo = await this.accountService.getAccountInfo(
      taskInfo.accountId,
    )
    if (!accountInfo)
      throw new AppException(ResponseCode.ChannelAccountInfoFailed)
    const { publishTime, accountType } = taskInfo
    taskInfo['queueId'] = `publish:${accountType}:${uuidv4()}`
    taskInfo['uid'] = accountInfo.uid
    taskInfo['userId'] = accountInfo.userId
    const newTask = await this.publishTaskModel.create(taskInfo)

    const now = Date.now()
    const immediatePublishWindow = [
      now - IMMEDIATE_PUBLISH_TOLERANCE_SECONDS,
      now + IMMEDIATE_PUBLISH_TOLERANCE_SECONDS,
    ]
    const publishImmediately = publishTime.getTime() >= immediatePublishWindow[0] && publishTime.getTime() <= immediatePublishWindow[1]
    if (!publishImmediately) {
      this.logger.log(`Publish task ${newTask.id} created, scheduled for ${publishTime.toISOString()}`)
      return newTask
    }

    const res = await this.enqueuePublishingTask(newTask)
    if (!res)
      throw new AppException(ResponseCode.PublishTaskFailed, { accountType })
    this.logger.log(`Publish task ${newTask.id} created and pushed to queue immediately`)
    return newTask
  }

  async updatePublishingTask(data: UpdatePublishTaskDto) {
    const supportPlatforms = [AccountType.FACEBOOK, AccountType.YOUTUBE]
    const task = await this.publishTaskModel.findById(data.id).exec()
    if (!task || task.userId !== data.userId) {
      throw new AppException(ResponseCode.PublishTaskNotFound)
    }
    if (task.status !== PublishStatus.PUBLISHED) {
      throw new AppException(ResponseCode.PublishTaskNotPublished)
    }

    if (!supportPlatforms.includes(task.accountType)) {
      throw new AppException(ResponseCode.PlatformNotSupported, 'Facebook and Youtube are supported for update')
    }

    if (task.option && task.option.facebook) {
      if (task.option?.facebook?.content_category !== 'post') {
        throw new AppException(ResponseCode.PostCategoryNotSupported, 'only post category is supported for Facebook')
      }
    }
    let UpdatedContentType = 'text'
    if (data.videoUrl) {
      UpdatedContentType = 'video'
    }
    else if (data.imgUrlList) {
      UpdatedContentType = 'image'
    }

    await this.publishTaskModel.updateOne({ _id: data.id }, {
      desc: data.desc,
      videoUrl: data.videoUrl,
      imgUrlList: data.imgUrlList,
      topics: data.topics,
      status: PublishStatus.WAITING_FOR_UPDATE,
    }).exec()
    await this.enqueueUpdatePublishedPostTask(task, UpdatedContentType)
    return true
  }

  async enqueuePublishingTask(task: PublishTask): Promise<boolean> {
    const jobId = uuidv4().toString()
    await this.publishTaskModel.updateOne({ _id: task.id }, { queueId: jobId })
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

  async enqueueUpdatePublishedPostTask(task: PublishTask, updatedContentType: string): Promise<boolean> {
    const jobId = uuidv4().toString()
    await this.publishTaskModel.updateOne({ _id: task.id }, { queueId: jobId })
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

  async getPublishTaskListByTime(
    start: Date,
    end: Date,
  ): Promise<PublishTask[]> {
    const filters: RootFilterQuery<PublishTask> = {
      publishTime: { $gte: start, $lte: end },
      status: PublishStatus.WaitingForPublish,
    }
    const list = await this.publishTaskModel.find(filters).sort({
      publishTime: 1,
    })

    return list
  }

  async getPublishTasks(
    query: PublishRecordListFilterDto,
  ): Promise<PublishTask[]> {
    const filters: RootFilterQuery<PublishTask> = {
      userId: query.userId,
      ...(query.accountId !== undefined && { accountId: query.accountId }),
      ...(query.accountType !== undefined && {
        accountType: query.accountType,
      }),
      ...(query.status !== undefined && {
        status: query.status,
      }),
      ...(query.type !== undefined && { type: query.type }),
      ...(query.time !== undefined
        && query.time.length === 2 && {
        publishTime: { $gte: query.time[0], $lte: query.time[1] },
      }),
      ...(query.uid !== undefined && { uid: query.uid }),
    }
    const db = this.publishTaskModel.find(filters).sort({
      createdAt: -1,
    })
    const list = await db.exec()

    return list
  }

  async getQueuedPublishTasks(query: {
    userId: string
    accountId?: string
    accountType?: AccountType
    time?: [Date?, Date?, ...unknown[]]
  }): Promise<PublishTask[]> {
    const filters: RootFilterQuery<PublishTask> = {
      status: PublishStatus.WaitingForPublish,
      userId: query.userId,
    }
    if (query.accountId) {
      filters.accountId = query.accountId
    }
    if (query.accountType) {
      filters.accountType = query.accountType
    }
    if (query.time && query.time.length === 2) {
      filters.publishTime = { $gte: query.time[0], $lte: query.time[1] }
    }
    return this.publishTaskModel.find(filters).sort({
      createdAt: -1,
    })
  }

  async getPublishedPublishTasks(query: {
    userId: string
    accountId?: string
    accountType?: AccountType
    time?: [Date?, Date?, ...unknown[]]
  }): Promise<PublishTask[]> {
    const filters: RootFilterQuery<PublishTask> = {
      status: PublishStatus.PUBLISHING,
      userId: query.userId,
    }
    if (query.accountId) {
      filters.accountId = query.accountId
    }
    if (query.accountType) {
      filters.accountType = query.accountType
    }
    if (query.time && query.time.length === 2) {
      filters.publishTime = { $gte: query.time[0], $lte: query.time[1] }
    }
    return this.publishTaskModel.find(filters).sort({
      createdAt: -1,
    })
  }

  async getPublishTaskListByFlowId(
    flowId: string,
  ): Promise<PublishTask[]> {
    const filters: RootFilterQuery<PublishTask> = {
      flowId,
    }
    const list = await this.publishTaskModel.find(filters).sort({
      publishTime: 1,
    })
    return list
  }

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
    const res = await this.publishTaskModel.updateOne({ _id: id }, newData)
    return res.modifiedCount > 0
  }

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

  async deletePublishTaskById(id: string, userId: string): Promise<boolean> {
    const task = await this.publishTaskModel.findById(id).exec()
    if (!task) {
      throw new AppException(ResponseCode.PublishTaskNotFound)
    }
    if (task.queued && !!task.queueId) {
      await this.deleteQueueTask(task.queueId)
    }

    // 删除数据库数据
    const res = await this.publishTaskModel.deleteOne({ _id: id, userId })
    return res.deletedCount > 0
  }

  async updatePublishTaskTime(id: string, publishTime: Date, userId: string) {
    const task = await this.publishTaskModel.findById(id).exec()
    if (!task) {
      throw new AppException(ResponseCode.PublishTaskNotFound)
    }

    const res = await this.publishTaskModel.updateOne(
      { _id: id, userId },
      { publishTime },
    )
    if (task.inQueue && !!task.queueId) {
      await this.deleteQueueTask(task.queueId)
    }
    return res.modifiedCount > 0
  }

  async getPublishTaskInfo(id: string) {
    return await this.publishTaskModel.findOne({ _id: id }).exec()
  }

  async getPublishTaskInfoWithFlowId(flowId: string, userId: string) {
    return await this.publishTaskModel.findOne({ flowId, userId }).exec()
  }

  async getPublishTaskInfoWithUserId(id: string, userId: string) {
    return await this.publishTaskModel.findOne({ _id: id, userId }).exec()
  }

  async publishTaskImmediately(id: string) {
    const taskDoc = await this.getPublishTaskInfo(id)
    const taskInfo = taskDoc!.toObject()
    if (!taskInfo) {
      throw new AppException(ResponseCode.PublishTaskNotFound)
    }
    if (taskInfo.status !== PublishStatus.WaitingForPublish) {
      throw new AppException(ResponseCode.PublishTaskStatusInvalid)
    }

    await this.publishTaskModel.updateOne({ _id: id }, { publishTime: new Date(), queued: true })
    await this.enqueuePublishingTask(taskInfo)
  }

  async handleTiktokPostWebhook(data: TiktokWebhookDto) {
    return this.tiktokPubService.handleTiktokPostWebhook(data)
  }

  async createPublishRecord(newData: Partial<PublishRecord>) {
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
    newData.publishTime = new Date()
    newData.queued = false
    newData.inQueue = false
    await this.publishTaskModel.updateOne(
      { _id: newData.id },
      { status: PublishStatus.PUBLISHED, errorMsg: '', dataId, workLink: data?.workLink, publishTime: newData.publishTime, queued: false, inQueue: false },
    ).exec()
    try {
      await this.createPublishRecord({
        ...newData,
        ...(data || {}),
        dataId,
      })
    }
    catch (error) {
      this.logger.error(`Failed to create publish record ${newData.id}: ${error}`)
    }
  }

  async onModuleDestroy() {
    this.logger.log('Module is being destroyed, closing publish queue...')
    await this.queueService.closePostPublishQueue()
    this.logger.log('Publish queue closed successfully')
  }
}
