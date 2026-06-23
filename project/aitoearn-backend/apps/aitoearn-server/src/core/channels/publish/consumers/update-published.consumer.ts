import type { Job } from 'bullmq'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { QueueName } from '@yikart/aitoearn-queue'
import { PublishTaskService } from '../tasks/publish-task.service'

@Processor(QueueName.UpdatePublishedPost)
export class UpdatePublishedConsumer extends WorkerHost {
  private readonly logger = new Logger(UpdatePublishedConsumer.name)

  constructor(private readonly publishTaskService: PublishTaskService) {
    super()
  }

  async process(job: Job<{ taskId: string }>) {
    this.logger.log(`Processing update job ${job.id}, task ${job.data.taskId}`)
    await this.publishTaskService.processUpdateJob(job.data.taskId)
  }
}
