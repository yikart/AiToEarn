import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'

import { QueueService } from '@yikart/aitoearn-queue'
import { PublishRecord } from '@yikart/aitoearn-server-client'
import { Model } from 'mongoose'
import {
  PublishStatus,
  PublishTask,
} from '../../../libs/database/schema/publishTask.schema'
import { DoPubRes } from '../common'

@Injectable()
export abstract class PublishBase {
  protected readonly queueName: string = 'unknown'
  protected readonly queueAttempts: number = 3 // 并发数量
  protected readonly queueDelay: number = 5 // 延迟时间

  @Inject(QueueService)
  protected readonly queueService: QueueService

  @Inject(EventEmitter2)
  protected readonly eventEmitter: EventEmitter2

  @InjectModel(PublishTask.name)
  protected readonly publishTaskModel: Model<PublishTask>

  constructor() {}

  // 检测授权是否失效
  abstract checkAuth(accountId: string): Promise<{
    status: 0 | 1
    timeout?: number // 秒
  }>

  // 进行发布（给队列调用）
  abstract doPub(publishTask: PublishTask): Promise<DoPubRes>

  protected async createPublishTask(newData: Partial<PublishTask>) {
    return await this.publishTaskModel.create(newData)
  }

  protected async createPublishRecord(newData: Partial<PublishRecord>) {
    newData.publishTime = newData.publishTime || new Date()
    this.eventEmitter.emit('publishRecord.create', newData)
  }

  /**
   * 推送任务
   * @param newData
   * @param doNum
   * @returns
   */
  async pushPubTask(task: PublishTask, attempts = 0): Promise<boolean> {
    await this.publishQueueOpen(task.id)
    const jobRes = await this.queueService.addPostPublishJob(
      {
        taskId: task.id,
        attempts: attempts++,
        jobId: task.queueId,
      },
      {
        attempts: this.queueAttempts,
        backoff: {
          type: 'exponential',
          delay: this.queueDelay, // 每次重试间隔 5 秒
        },
        removeOnComplete: true,
        removeOnFail: true,
        jobId: task.queueId, // 确保任务id唯一，防止重复执行
      },
    )
    return jobRes.id === task.queueId
  }

  // 将数据的队列状态改为 true
  async publishQueueOpen(id: string) {
    this.publishTaskModel.updateOne({ _id: id }, { inQueue: true })
  }

  // 获取发布任务信息
  protected async getPublishTaskInfo(id: string) {
    return this.publishTaskModel.findOne({ _id: id })
  }

  // 删除发布任务
  private async delPublishTask(id: string) {
    return this.publishTaskModel.deleteOne({ _id: id })
  }

  // 完成发布任务
  protected async completePublishTask(
    newData: PublishTask,
    dataId: string,
    data?: {
      // 作品链接
      workLink: string
      dataOption?: Record<string, any>
    },
  ) {
    newData.status = PublishStatus.PUBLISHED
    await this.createPublishRecord({
      ...newData,
      ...(data || {}),
      dataId,
    })
    await this.delPublishTask(newData.id)
  }
}
