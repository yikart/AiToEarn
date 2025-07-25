/*
 * @Author: nevin
 * @Date: 2024-07-03 15:16:12
 * @LastEditTime: 2025-02-10 17:18:50
 * @LastEditors: nevin
 * @Description: 视频发布队列
 */
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PublishStatus } from '@/libs/database/schema/publishTask.schema'
import { PublishTaskService } from './publishTask.service'

@Processor('bull_publish', {
  concurrency: 3,
})
export class BullPublish extends WorkerHost {
  constructor(readonly publishTaskService: PublishTaskService) {
    super()
  }

  async process(
    job: Job<{
      id: string
      doNum: number
    }>,
  ): Promise<any> {
    Logger.log(`开始执行任务，任务ID：${job.data.id}，重试次数：${job.data.doNum}`)

    const { id } = job.data
    const infoDoc = await this.publishTaskService.getPublishTaskInfo(id)
    const info = infoDoc!.toObject()
    if (!info) {
      void job.isCompleted()
      return
    }

    const { status, message, noRetry }
      = await this.publishTaskService.doPub(info)

    if (status === PublishStatus.FAIL) {
      if (!noRetry)
        throw new Error(message)

      await job.moveToFailed(new Error('任务失败，不再重试'), 'completed') // 直接标记为失败且不重试
      return
    }

    if (status === PublishStatus.RELEASED) {
      void job.isCompleted()
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted() {
    Logger.log('---- bull_publish --- completed')
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<{ id: string }>, error: Error) {
    if (job.attemptsMade === job.opts.attempts) {
      // 这里就是“超过最大重试次数”了
      Logger.error('任务已达最大重试次数，彻底失败！', job.id)
      // 你可以在这里做告警、补偿、人工介入等操作
    }

    // do some stuff
    void this.publishTaskService.upPublishTaskStatus(job.data.id, {
      status: PublishStatus.FAIL,
      errorMsg: error.message,
    })
    Logger.log(error)
    Logger.log('---- bull_publish --- failed')
  }
}
