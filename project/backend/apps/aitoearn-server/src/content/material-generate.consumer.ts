/*
 * @Author: nevin
 * @Date: 2024-07-03 15:16:12
 * @LastEditTime: 2025-02-10 17:18:50
 * @LastEditors: nevin
 * @Description: 素材生成队列
 */
import {
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { QueueName, QueueService } from '@yikart/aitoearn-queue'
import { MaterialTaskStatus } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'
import { Job } from 'bullmq'
import { MaterialService } from './material.service'
import { MaterialGroupService } from './materialGroup.service'
import { MaterialTaskService } from './materialTask.service'

@Processor(QueueName.MaterialGenerate, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class MaterialGenerateConsumer extends WorkerHost {
  logger = new Logger(MaterialGenerateConsumer.name)
  constructor(
    readonly redisService: RedisService,
    readonly materialService: MaterialService,
    readonly materialTaskService: MaterialTaskService,
    readonly materialGroupService: MaterialGroupService,
    private readonly queueService: QueueService,
  ) {
    super()
  }

  async process(
    job: Job<{
      taskId: string
    }>,
  ): Promise<any> {
    const taskInfo = await this.materialTaskService.getInfo(job.data.taskId)
    this.logger.log({
      data: taskInfo,
      message: '任务开始执行',
      path: 'process --------- 0',
    })
    if (
      !taskInfo
      || [MaterialTaskStatus.FAIL, MaterialTaskStatus.SUCCESS].includes(
        taskInfo.status,
      )
      || taskInfo.reNum < 1
    ) {
      this.logger.log({
        data: 0,
        message: '任务退出执行',
        path: 'process --------- 1',
      })
      void job.isCompleted()
      return
    }

    const { status, message }
      = await this.materialTaskService.doCreateTask(taskInfo)
    this.logger.log({
      data: { status, message },
      message: '任务执行结果',
      path: 'process --------- 2',
    })
    if (status === -1) {
      this.logger.log({ msg: message })
      void job.isCompleted()
      return
    }

    await this.queueService.addMaterialGenerateJob({
      taskId: job.data.taskId,
    }, {
      removeOnFail: true,
    })
  }

  @OnWorkerEvent('completed')
  // onCompleted(e: any) {
  onCompleted() {
    // do some stuff
    this.logger.log('--- bull_material_generate --- completed')
  }
}
