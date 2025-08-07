import { CRON_SCAN_WINDOW_MS, IMMEDIATE_PUSH_THRESHOLD_MS, TIMED_TASK_INTERVAL } from '@core/publish/constant'
import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Interval } from '@nestjs/schedule'
import { Queue } from 'bullmq'
import { Model, RootFilterQuery } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { AppException, sleep } from '@/common'
import { RedisService } from '@/libs'
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
export class PublishTaskService {
  private readonly publishMap = new Map<AccountType, PublishBase>()

  constructor(
    @InjectModel(PublishTask.name)
    private readonly publishTaskModel: Model<PublishTask>,
    @InjectModel(PublishRecord.name)
    private readonly publishRecordModel: Model<PublishRecord>,
    private readonly bilibiliPubService: BilibiliPubService,
    private readonly kwaiPubService: kwaiPubService,
    private readonly youtubePubService: YoutubePubService,
    private readonly redisService: RedisService,
    private readonly wxGzhPubService: WxGzhPubService,
    private readonly facebookPubService: FacebookPublishService,
    private readonly instagramPubService: InstagramPublishService,
    private readonly threadPubService: ThreadsPublishService,
    private readonly tiktokPubService: TiktokPubService,
    private readonly twitterPubService: TwitterPublishService,
    @InjectQueue('bull_publish') private readonly publishQueue: Queue,
  ) {
    this.publishMap.set(AccountType.BILIBILI, this.bilibiliPubService)
    this.publishMap.set(AccountType.KWAI, this.kwaiPubService)
    this.publishMap.set(AccountType.YOUTUBE, this.youtubePubService);
    this.publishMap.set(AccountType.FACEBOOK, this.facebookPubService)
    this.publishMap.set(AccountType.INSTAGRAM, this.instagramPubService)
    this.publishMap.set(AccountType.THREADS, this.threadPubService)
    this.publishMap.set(AccountType.WxGzh, this.wxGzhPubService)
    this.publishMap.set(AccountType.TIKTOK, this.tiktokPubService)
    this.publishMap.set(AccountType.TWITTER, this.twitterPubService)

    // 清除队列中的任务
    // (async () => {
    //   Logger.log('------------------------------')
    //   const waitingCount = await this.publishQueue.getWaitingCount()
    //   const delayedCount = await this.publishQueue.getDelayedCount()
    //   const active = await this.publishQueue.getActive()
    //   Logger.log(`waitingCount：${waitingCount}`)
    //   Logger.log(`delayedCount：${delayedCount}`)
    //   Logger.log(`active：${active}`)
    //
    //   await this.publishQueue.pause()
    //   while (!(await this.publishQueue.isPaused())) {
    //     await new Promise(resolve => setTimeout(resolve, 100)) // 等待队列真正暂停
    //   }
    //   await this.publishQueue.obliterate({ force: true })
    // })()
  }

  async createPub(newData: NewPulData<PlatPulOption>) {
    const { publishTime } = newData
    newData['queueId'] = `publish_${newData.accountType}:${uuidv4()}`
    const newTask = await this.publishTaskModel.create(newData)

    if (publishTime.getTime() > Date.now() + IMMEDIATE_PUSH_THRESHOLD_MS)
      return newTask

    // 两小时内，直接推送任务
    const server = this.publishMap.get(newData.accountType)
    if (!server)
      throw new AppException(1, '未找到该平台的发布服务')

    const res = await server.pushPubTask(newTask)
    if (!res)
      throw new AppException(1, '创建发布任务失败！')
    return newTask
  }

  /**
   * 推送任务-定时器使用
   * @param publishTask
   * @returns
   */
  async pushPubTask(publishTask: PublishTask) {
    // 两小时内，直接推送任务
    const server = this.publishMap.get(publishTask.accountType)
    if (!server)
      throw new AppException(1, '未找到该平台的发布服务')

    const res = await server.pushPubTask(publishTask)
    if (!res)
      throw new AppException(1, '推送发布任务失败')
    return res
  }

  /**
   * 给任务调用的方法
   * @param publishTask 任务
   * @returns 推送结果
   */
  async doPub(publishTask: PublishTask) {
    const server = this.publishMap.get(publishTask.accountType)
    Logger.log(`开始执行发布任务 ${publishTask.id}`, server)
    if (!server) {
      return {
        status: PublishStatus.FAIL,
        message: '未找到该平台的发布服务',
        noRetry: true,
      }
    }
    await this.upPublishTaskStatus(publishTask.id, {
      status: PublishStatus.PUB_LOADING,
    })
    const res = await server.doPub(publishTask)
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
      status: PublishStatus.UNPUBLISH,
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
  async upPublishTaskStatus(
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
  async nowPubTask(id: string) {
    const newDataDoc = await this.getPublishTaskInfo(id)
    const newData = newDataDoc!.toObject()
    if (!newData) {
      throw new AppException(1, '任务不存在')
    }
    if (newData.status !== PublishStatus.UNPUBLISH) {
      throw new AppException(1, '任务无法发布')
    }
    const server = this.publishMap.get(newData.accountType)

    newData.publishTime = new Date()
    await this.publishTaskModel.updateOne({ _id: id }, newData)
    server?.pushPubTask(newData)
    return true
  }

  async handleTiktokPostWebhook(data: TiktokWebhookDto) {
    return this.tiktokPubService.handleTiktokPostWebhook(data)
  }

  // 定时任务
  @Interval(TIMED_TASK_INTERVAL)
  async handleCron() {
    void this.redisService.setKey('platPublish:task', Date.now(), 60 * 30)
    // 获取当前时间和一个半小时后的时间
    const start = new Date()
    const end = new Date(start.getTime() + CRON_SCAN_WINDOW_MS)

    const taskList = await this.getPublishTaskListByTime(start, end)
    Logger.log(
      `--------- 定时任务检测 start（${start.toUTCString()}）- end（${end.toUTCString()}），推送${taskList.length}条任务 ---------`,
    )

    taskList.forEach((pubilshTask) => {
      void this.pushPubTask(pubilshTask)
    })
    await sleep(1000 * 60)
    void this.redisService.del('platPublish:task')
  }
}
