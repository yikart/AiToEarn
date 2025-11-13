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
      const start = new Date(now - IMMEDIATE_PUBLISH_TOLERANCE_SECONDS)
      const end = new Date(now + IMMEDIATE_PUBLISH_TOLERANCE_SECONDS)

      const tasks = await this.publishingService.getPublishTaskListByTime(start, end)
      if (tasks.length === 0) {
        this.logger.log(`Pushing scheduled publish tasks from ${start.toISOString()} to ${end.toISOString()}: No scheduled publish tasks found`)
        this.logger.log(`Pushing scheduled publish tasks completed, current time: ${new Date().toISOString()}`)
        return
      }
      this.logger.log(
        `Pushing scheduled publish tasks from ${start.toISOString()} to ${end.toISOString()}, found ${tasks.length} tasks`,
      )

      for (const task of tasks) {
        await this.publishingService.enqueuePublishingTask(task)
      }
      this.logger.log(`Pushing scheduled publish tasks completed, current time: ${new Date().toISOString()}`)
    }
    catch (error) {
      this.logger.error(`Error pushing scheduled publish tasks: ${error.message}`, error.stack)
      this.logger.log(`Pushing scheduled publish tasks completed, current time: ${new Date().toISOString()}`)
    }
  }
}
