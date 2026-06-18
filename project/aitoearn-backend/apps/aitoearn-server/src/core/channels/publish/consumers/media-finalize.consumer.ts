import type { Job } from 'bullmq'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { QueueName } from '@yikart/aitoearn-queue'
import { PublishTaskService } from '../tasks/publish-task.service'

@Processor(QueueName.PostMediaTask)
export class MediaFinalizeConsumer extends WorkerHost {
  private readonly logger = new Logger(MediaFinalizeConsumer.name)

  constructor(private readonly publishTaskService: PublishTaskService) {
    super()
  }

  async process(job: Job<{ taskId: string, attempts: number }>) {
    this.logger.log(`Processing media finalize job ${job.id}, task ${job.data.taskId}`)
    await this.publishTaskService.processFinalizeJob(job.data.taskId, job.data.attempts ?? 0)
  }
}
