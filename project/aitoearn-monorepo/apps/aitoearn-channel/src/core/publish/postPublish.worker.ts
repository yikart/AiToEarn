/*
 * @Author: nevin
 * @Date: 2024-07-03 15:16:12
 * @LastEditTime: 2025-02-10 17:18:50
 * @LastEditors: nevin
 * @Description: 视频发布队列
 */
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger, OnModuleDestroy } from '@nestjs/common'
import { Job } from 'bullmq'
import { PublishStatus } from '../../libs/database/schema/publishTask.schema'
import { PublishTaskService } from './publishTask.service'

@Processor('post_publish', {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class PostPublishWorker extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(PostPublishWorker.name)
  constructor(readonly publishTaskService: PublishTaskService) {
    super()
  }

  // Todo: doPub timeout control
  async process(
    job: Job<{
      taskId: string
      attempts: number
      jobId?: string
      timeout?: number
    }>,
  ): Promise<any> {
    const { taskId, attempts, timeout } = job.data
    this.logger.log(`[task-${taskId}] Processing Publish Task, data: ${JSON.stringify(job.data)}, Attempts: ${attempts}`)

    try {
      const taskDoc = await this.publishTaskService.getPublishTaskInfo(taskId)
      if (!taskDoc) {
        this.logger.error(`[task-${taskId}] Publish task not found: ${taskId}`)
        return
      }

      const taskInfo = taskDoc.toObject()
      if (timeout && timeout > 0) {
        this.logger.log(`[task-${taskId}] Publish task timeout set to ${timeout}ms`)

        const publishPromise = this.publishTaskService.doPub(taskInfo)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`[task-${taskId}] Publish task timeout after ${timeout}ms`))
          }, timeout)
        })

        const result = await Promise.race([publishPromise, timeoutPromise])

        if (result.status === PublishStatus.FAILED) {
          this.logger.error(`[task-${taskId}] Publish task failed: ${taskId}, Message: ${result.message}`)
          throw new Error(result.message)
        }

        this.logger.log(`[task-${taskId}] Publish task completed successfully with timeout control`)
        return result
      }
      else {
        const result = await this.publishTaskService.doPub(taskInfo)

        if (result.status === PublishStatus.FAILED) {
          this.logger.error(`[task-${taskId}] Publish task failed: ${taskId}, Message: ${result.message}`)
          throw new Error(result.message)
        }

        this.logger.log(`[task-${taskId}] Publish task completed successfully`)
        return result
      }
    }
    catch (error) {
      this.logger.error(`[task-${taskId}] Error processing job ${job.id}: ${error.message}`, error.stack)
      throw new Error(`[task-${taskId}] Job ${job.id} failed: ${error.message}`)
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>) {
    const { taskId, attempts, jobId } = job.data
    this.logger.log(`[task-${taskId}] Processing completed for job ${jobId}, taskId: ${taskId}, Attempts: ${attempts}`)
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>, error: Error) {
    if (job.attemptsMade === job.opts.attempts) {
      this.logger.error(`[task-${job.data.taskId}] Job ${job.id} failed after all attempts: ${error.message}`)
      await this.publishTaskService.updatePublishTaskStatus(job.data.taskId, {
        status: PublishStatus.FAILED,
        errorMsg: error.message,
      })
      this.logger.log(`[task-${job.data.taskId}] Publish task ${job.data.taskId} marked as failed after all attempts.`)
      return
    }
    this.logger.warn(`[task-${job.data.taskId}] Job ${job.data.taskId} failed, retrying... Attempts made: ${job.attemptsMade}`)
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.error(`Job ${job.id}] is stalled, data ${job.data}`)
  }

  async onModuleDestroy() {
    this.logger.log('PostPublishWorker is being destroyed, closing worker...')
    await this.worker.close()
    this.logger.log('PostPublishWorker closed successfully')
  }
}
