import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger, OnModuleDestroy } from '@nestjs/common'
import { QueueName } from '@yikart/aitoearn-queue'
import { Job } from 'bullmq'
import { PublishStatus } from '../../../../libs/database/schema/publishTask.schema'
import { PublishTaskService } from '../../publishTask.service'
import { MetaPublishService } from './meta.service'

@Processor(QueueName.PostMediaTask, {
  concurrency: 3,
  stalledInterval: 15000,
  maxStalledCount: 1,
})
export class MetaPublishConsumer extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(MetaPublishConsumer.name)
  constructor(
    readonly publishTaskService: PublishTaskService,
    readonly metaPublishService: MetaPublishService,
  ) {
    super()
  }

  async process(job: Job<{
    taskId: string
    attempts: number
  }>): Promise<any> {
    this.logger.log(`[task-${job.data.taskId}] Processing Meta Post Publish Task: ${job.data.taskId}`)
    try {
      const publishTaskInfo = await this.publishTaskService.getPublishTaskInfo(job.data.taskId)
      const publishTask = publishTaskInfo!.toObject()
      if (!publishTask) {
        this.logger.error(`[task-${job.data.taskId}] Publish task not found: ${job.data.taskId}`)
        return
      }
      publishTask.publishTime = new Date()
      this.logger.log(`[task-${job.data.taskId}] Publish task details: ${JSON.stringify(publishTask)}`)
      const { status, message } = await this.metaPublishService.publishPost(publishTask)

      if (status !== PublishStatus.PUBLISHED) {
        this.logger.error(`[task-${job.data.taskId}] Publish task failed: ${job.data.taskId}, Message: ${message}`)
        throw new Error(message)
      }
      this.logger.debug(`[task-${job.data.taskId}] Publish task details: ${JSON.stringify(publishTask)}`)
      return { status: 'success', message: 'Post published successfully' }
    }
    catch (error) {
      this.logger.error(`[task-${job.data.taskId}] Error processing job ${job.id}: ${error.message}`, error.stack)
      throw new Error(`[task-${job.data.taskId}] Job ${job.id} failed: ${error.message}`)
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>) {
    const { taskId, attempts, jobId } = job.data
    this.logger.log(`[task-${job.data.taskId}] Processing completed for job ${jobId}, taskId: ${taskId}, Attempts: ${attempts}`)
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>, error: Error) {
    const { taskId } = job.data
    if (job.attemptsMade === job.opts.attempts) {
      this.logger.error(`[task-${job.data.taskId}] Job ${taskId} failed after all attempts: ${error.message}`)
      await this.publishTaskService.updatePublishTaskStatus(taskId, {
        status: PublishStatus.FAILED,
        errorMsg: error.message,
      })
      this.logger.log(`[task-${job.data.taskId}] Publish task ${taskId} marked as failed after all attempts. and removed from queue.`)
      return
    }
    this.logger.warn(`[task-${job.data.taskId}] Job ${taskId} failed, retrying... Attempts made: ${job.attemptsMade}`)
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job<{
    taskId: string
    attempts: number
    jobId?: string
  }>) {
    this.logger.error(`[task-${job.data.taskId}] Job stalled: ${job.id}`)
  }

  async onModuleDestroy() {
    this.logger.log('MetaPublishConsumer is being destroyed, closing worker...')
    await this.worker.close()
    this.logger.log('MetaPublishConsumer closed successfully')
  }
}
