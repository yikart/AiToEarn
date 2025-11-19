import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { IMMEDIATE_PUBLISH_TOLERANCE_SECONDS, PUBLISHING_SCHEDULED_TASK_CRON_EXPRESSION } from '../constant'
import { PublishingService } from '../publishing.service'

@Injectable()
export class EnqueuePublishingTaskScheduler {
  private readonly logger = new Logger(EnqueuePublishingTaskScheduler.name)

  constructor(
    private readonly publishingService: PublishingService,
  ) {}

  @Cron(PUBLISHING_SCHEDULED_TASK_CRON_EXPRESSION, { waitForCompletion: true })
  async enqueueScheduledPublishingTasks() {
    this.logger.log(`Start pushing scheduled publish tasks, current time: ${new Date().toISOString()}`)
    try {
      const now = Date.now()
      const cutoffTime = new Date(now + IMMEDIATE_PUBLISH_TOLERANCE_SECONDS)

      const tasks = await this.publishingService.getPublishTaskListByTime(cutoffTime)
      if (tasks.length === 0) {
        this.logger.log(`Pushing scheduled publish tasks completed: No scheduled publish tasks found before ${cutoffTime.toISOString()}`)
        return
      }

      for (const task of tasks) {
        await this.publishingService.enqueuePublishingTask(task)
      }
      this.logger.log(`Pushing scheduled publish tasks completed: ${tasks.length} tasks found before ${cutoffTime.toISOString()}`)
    }
    catch (error) {
      this.logger.error(`Error pushing scheduled publish tasks: ${error.message}`, error.stack)
    }
  }
}
