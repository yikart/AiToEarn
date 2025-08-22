import { IMMEDIATE_PUSH_THRESHOLD_MS, PUSH_SCHEDULED_TASK_CRON_EXPRESSION, PUSH_SCHEDULED_TASK_QUERY_WINDOW_MS } from '@core/publish/constant'
import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Cron } from '@nestjs/schedule'
import { Queue } from 'bullmq'
import { Model, RootFilterQuery } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { AppException } from '@/common'
import { PublishRecord } from '@/libs/database/schema/publishRecord.schema'
import { PublishStatus, PublishTask } from '@/libs/database/schema/publishTask.schema'
import { AccountType } from '@/transports/account/common'
import { NewPulData, PlatPulOption } from './common'
import { TiktokWebhookDto } from './dto/tiktok.webhook.dto'
import { BilibiliPubService } from './plat/bilibiliPub.service'
import { kwaiPubService } from './plat/kwaiPub.service'
import { FacebookPublishService } from './plat/meta/facebook.service'
import { InstagramPublishService } from './plat/meta/instgram.service'
import { ThreadsPublishService } from './plat/meta/threads.service'
import { TwitterPublishService } from './plat/meta/twitter.service'
import { PublishBase } from './plat/publish.base'
import { TiktokPubService } from './plat/tiktokPub.service'
import { WxGzhPubService } from './plat/wxGzhPub.service'
import { YoutubePubService } from './plat/youtubePub.service'

@Injectable()
export class PublishTaskService implements OnModuleDestroy {
  private readonly publishServiceMap = new Map<AccountType, PublishBase>()
  private readonly logger = new Logger(PublishTaskService.name)

  constructor(
    @InjectModel(PublishTask.name)
    private readonly publishTaskModel: Model<PublishTask>,
    private readonly bilibiliPubService: BilibiliPubService,
    private readonly kwaiPubService: kwaiPubService,
    private readonly youtubePubService: YoutubePubService,
    private readonly wxGzhPubService: WxGzhPubService,
    private readonly facebookPubService: FacebookPublishService,
    private readonly instagramPubService: InstagramPublishService,
    private readonly threadPubService: ThreadsPublishService,
    private readonly tiktokPubService: TiktokPubService,
    private readonly twitterPubService: TwitterPublishService,
    @InjectQueue('post_publish') private readonly publishQueue: Queue,
  ) {
    this.publishServiceMap.set(AccountType.BILIBILI, this.bilibiliPubService)
    this.publishServiceMap.set(AccountType.KWAI, this.kwaiPubService)
    this.publishServiceMap.set(AccountType.YOUTUBE, this.youtubePubService);
    this.publishServiceMap.set(AccountType.FACEBOOK, this.facebookPubService)
    this.publishServiceMap.set(AccountType.INSTAGRAM, this.instagramPubService)
    this.publishServiceMap.set(AccountType.THREADS, this.threadPubService)
    this.publishServiceMap.set(AccountType.WxGzh, this.wxGzhPubService)
    this.publishServiceMap.set(AccountType.TIKTOK, this.tiktokPubService)
    this.publishServiceMap.set(AccountType.TWITTER, this.twitterPubService)
  }

  async createPub(taskInfo: NewPulData<PlatPulOption>) {
    const { publishTime, accountType } = taskInfo
    taskInfo['queueId'] = `publish:${accountType}:${uuidv4()}`
    const newTask = await this.publishTaskModel.create(taskInfo)

    const publishImmediately = publishTime.getTime() < (Date.now() + IMMEDIATE_PUSH_THRESHOLD_MS)
    if (!publishImmediately)
      return newTask

    const res = await this.pushPubTask(newTask)
    if (!res)
      throw new AppException(1, `task publish failed, accountType: ${accountType}`)
    return newTask
  }

  /**
   * 推送任务-定时器使用
   * @param publishTask
   * @returns
   */
  async pushPubTask(publishTask: PublishTask) {
    const pubService = this.publishServiceMap.get(publishTask.accountType)
    if (!pubService)
      throw new AppException(1, `publish service for ${publishTask.accountType} not found`)

    const res = await pubService.pushPubTask(publishTask)
    if (!res)
      throw new AppException(1, `task publish failed, accountType: ${publishTask.accountType}`)
    return res
  }

  /**
   * 给任务调用的方法
   * @param publishTask 任务
   * @returns 推送结果
   */
  async doPub(publishTask: PublishTask) {
    const pubService = this.publishServiceMap.get(publishTask.accountType)
    this.logger.log(`Processing Publish Task: ${publishTask.id}, Account Type: ${publishTask.accountType}`)
    if (!pubService) {
      return {
        status: PublishStatus.FAILED,
        message: `publish service for ${publishTask.accountType} not found`,
        noRetry: true,
      }
    }
    await this.updatePublishTaskStatus(publishTask.id, {
      status: PublishStatus.PUBLISHING,
    })
    console.log('doPublishTask-------------', pubService);
    
    const res = await pubService.doPub(publishTask)
    console.log('doPublishTask-------------222222222', res);

    return res
  }

  /**
   * 获取时间段内发布任务列表
   * @param start
   * @param end
   * @returns
   */
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

  /**
   * 更新任务状态
   * @param id
   * @param newData
   * @returns
   */
  async updatePublishTaskStatus(
    id: string,
    newData: {
      errorMsg?: string
      status: PublishStatus
    },
  ): Promise<boolean> {
    const res = await this.publishTaskModel.updateOne({ _id: id }, newData)
    return res.modifiedCount > 0
  }

  // 查询任务是否在队列中，如果在，删除队列中的任务
  async deleteQueueTask(queueId: string) {
    const job = await this.publishQueue.getJob(queueId)
    if (job) {
      const state = await job.getState()
      if (state === 'waiting' || state === 'delayed') {
        // 如果任务处于等待或延迟状态，则移除它
        await job.remove()
        Logger.log(`任务 ${queueId} 已从队列中移除`)
      }
      else if (state === 'active') {
        // 如果任务正在执行中，不建议删除
        throw new AppException(1, '任务正在执行中，无法删除')
      }
    }
  }

  // 删除任务
  async deletePublishTaskById(id: string, userId: string): Promise<boolean> {
    // 获取数据
    const task = await this.publishTaskModel.findById(id).exec()
    if (!task) {
      throw new AppException(1, '任务不存在')
    }
    if (task.inQueue && !!task.queueId) {
      await this.deleteQueueTask(task.queueId)
    }

    // 删除数据库数据
    const res = await this.publishTaskModel.deleteOne({ _id: id, userId })
    return res.deletedCount > 0
  }

  // 更新任务时间
  async updatePublishTaskTime(id: string, publishTime: Date, userId: string) {
    const task = await this.publishTaskModel.findById(id).exec()
    if (!task) {
      throw new AppException(1, '任务不存在')
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

  // 获取发布任务信息
  async getPublishTaskInfo(id: string) {
    return this.publishTaskModel.findOne({ _id: id })
  }

  // 立即发布任务
  async publishTaskNow(id: string) {
    const taskDoc = await this.getPublishTaskInfo(id)
    const taskInfo = taskDoc!.toObject()
    if (!taskInfo) {
      throw new AppException(1, 'publish task not found')
    }
    if (taskInfo.status !== PublishStatus.WaitingForPublish) {
      throw new AppException(1, 'task has been published or is in progress')
    }
    const pubService = this.publishServiceMap.get(taskInfo.accountType)

    taskInfo.publishTime = new Date()
    await this.publishTaskModel.updateOne({ _id: id }, taskInfo)
    await pubService?.pushPubTask(taskInfo)
    return true
  }

  async handleTiktokPostWebhook(data: TiktokWebhookDto) {
    return this.tiktokPubService.handleTiktokPostWebhook(data)
  }

  // push scheduled publish tasks
  @Cron(PUSH_SCHEDULED_TASK_CRON_EXPRESSION, { waitForCompletion: true })
  async pushScheduledPubTasks() {
    this.logger.log(`Start pushing scheduled publish tasks, current time: ${new Date().toISOString()}`)
    try {
      const start = new Date()
      const end = new Date(start.getTime() + PUSH_SCHEDULED_TASK_QUERY_WINDOW_MS)

      const tasks = await this.getPublishTaskListByTime(start, end)
      if (tasks.length === 0) {
        this.logger.log(`Pushing scheduled publish tasks from ${start.toISOString()} to ${end.toISOString()}: No scheduled publish tasks found`)
        this.logger.log(`Pushing scheduled publish tasks completed, current time: ${new Date().toISOString()}`)
        return
      }
      this.logger.log(
        `Pushing scheduled publish tasks from ${start.toISOString()} to ${end.toISOString()}, found ${tasks.length} tasks`,
      )

      for (const task of tasks) {
        await this.pushPubTask(task)
      }
      this.logger.log(`Pushing scheduled publish tasks completed, current time: ${new Date().toISOString()}`)
    }
    catch (error) {
      this.logger.error(`Error pushing scheduled publish tasks: ${error.message}`, error.stack)
      this.logger.log(`Pushing scheduled publish tasks completed, current time: ${new Date().toISOString()}`)
    }
  }

  async onModuleDestroy() {
    this.logger.log('Module is being destroyed, closing publish queue...')
    await this.publishQueue.close()
    this.logger.log('Publish queue closed successfully')
  }
}
