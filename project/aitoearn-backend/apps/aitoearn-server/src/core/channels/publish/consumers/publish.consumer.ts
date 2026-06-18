import type { Job } from 'bullmq'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { QueueName } from '@yikart/aitoearn-queue'
import { PublishTaskService } from '../tasks/publish-task.service'

@Processor(QueueName.PostPublish)
export class PublishConsumer extends WorkerHost {
  private readonly logger = new Logger(PublishConsumer.name)

  constructor(private readonly publishTaskService: PublishTaskService) {
    super()
  }

  async process(job: Job<{ taskId: string, attempts: number }>) {
    this.logger.log(`Processing publish job ${job.id}, task ${job.data.taskId}`)
    await this.publishTaskService.processPublishJob(job.data.taskId, job.data.attempts ?? 0)
  }
}
