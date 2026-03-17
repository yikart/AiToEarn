import {
  OnWorkerEvent,
  WorkerHost,
} from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { NotificationData, QueueName, QueueProcessor } from '@yikart/aitoearn-queue'
import { Job } from 'bullmq'
import { NotificationService } from './notification.service'

@QueueProcessor(QueueName.Notification, {
  concurrency: 5,
  stalledInterval: 30000,
  maxStalledCount: 2,
})
export class NotificationConsumer extends WorkerHost {
  logger = new Logger(NotificationConsumer.name)
  constructor(
    private readonly notificationService: NotificationService,
  ) {
    super()
  }

  async process(
    job: Job<NotificationData>,
  ): Promise<void> {
    await this.notificationService.sendNotification(job.data)
  }

  @OnWorkerEvent('completed')
  onCompleted() {
    this.logger.debug('--- notification --- completed')
  }
}
