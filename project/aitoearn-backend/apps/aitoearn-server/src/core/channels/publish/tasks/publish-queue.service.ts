import { Injectable, Logger } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'

@Injectable()
export class PublishQueueService {
  private readonly logger = new Logger(PublishQueueService.name)

  constructor(private readonly queueService: QueueService) {}

  async enqueueImmediate(taskId: string, attempts = 0): Promise<string> {
    const jobId = this.getPublishJobId(taskId, attempts)
    await this.queueService.addPostPublishJob({ taskId, attempts, jobId }, {
      jobId,
      removeOnComplete: true,
      removeOnFail: 100,
    })
    this.logger.log(`Enqueued immediate publish for task ${taskId}`)
    return jobId
  }

  async enqueueDelayed(taskId: string, delayMs: number, attempts = 0): Promise<string> {
    const jobId = this.getPublishJobId(taskId, attempts)
    await this.queueService.addPostPublishJob({ taskId, attempts, jobId }, {
      jobId,
      delay: delayMs,
      removeOnComplete: true,
      removeOnFail: 100,
    })
    this.logger.log(`Enqueued delayed publish for task ${taskId}, delay ${delayMs}ms`)
    return jobId
  }

  async removeJob(taskId: string): Promise<boolean> {
    try {
      for (let attempts = 0; attempts < 3; attempts++) {
        const job = await this.queueService.getPostPublishJob(this.getPublishJobId(taskId, attempts))
        if (job) {
          await job.remove()
          return true
        }
      }
      return false
    }
    catch (err) {
      this.logger.error(err, `Failed to remove job for task ${taskId}`)
      return false
    }
  }

  async enqueueMediaFinalize(taskId: string, delayMs = 0, attempts = 0): Promise<void> {
    const jobId = `media-finalize-${taskId}-${attempts}`
    await this.queueService.addPostMediaTaskJob({ taskId, attempts, jobId }, {
      jobId,
      delay: delayMs,
      removeOnComplete: true,
      removeOnFail: 100,
    })
  }

  async enqueueUpdate(taskId: string): Promise<void> {
    await this.queueService.addUpdatePublishedPostJob({ taskId, updatedContentType: '' }, {
      jobId: `publish-update-${taskId}`,
      removeOnComplete: true,
      removeOnFail: 100,
    })
  }

  private getPublishJobId(taskId: string, attempts = 0): string {
    return attempts > 0 ? `publish-${taskId}-${attempts}` : `publish-${taskId}`
  }
}
