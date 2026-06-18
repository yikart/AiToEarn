import type { AccountType } from '@yikart/common'
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PublishRecordRepository, PublishStatus } from '@yikart/mongodb'
import { PlatformIntegrationRegistry } from '../../platforms/platforms.registry'
import { PublishQueueService } from '../tasks/publish-queue.service'
import { PublishStateService } from '../tasks/publish-state.service'
import { PublishTaskService } from '../tasks/publish-task.service'

const DEFAULT_SCHEDULE_WINDOW_MS = 24 * 60 * 60 * 1000

@Injectable()
export class PublishScheduler {
  private readonly logger = new Logger(PublishScheduler.name)

  constructor(
    private readonly publishRecordRepo: PublishRecordRepository,
    private readonly registry: PlatformIntegrationRegistry,
    private readonly stateService: PublishStateService,
    private readonly queueService: PublishQueueService,
    private readonly taskService: PublishTaskService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async loadTasksEnteringScheduleWindow() {
    const now = new Date()
    const maxScheduleWindow = this.getMaxScheduleWindow()
    const windowEnd = new Date(now.getTime() + maxScheduleWindow)

    const tasks = await this.publishRecordRepo.getPublishTaskListByTime(windowEnd)
    const eligible = tasks.filter(t =>
      t.status === PublishStatus.WaitingForPublish,
    )

    for (const task of eligible) {
      try {
        const diffMs = new Date(task.publishTime).getTime() - now.getTime()
        const scheduleWindow = this.getScheduleWindow(task.accountType)
        if (diffMs > scheduleWindow) {
          continue
        }
        const queued = await this.stateService.markQueued(task.id)
        if (!queued) {
          continue
        }
        try {
          if (diffMs <= 0) {
            await this.queueService.enqueueImmediate(task.id)
          }
          else {
            await this.queueService.enqueueDelayed(task.id, diffMs)
          }
        }
        catch (err) {
          await this.stateService.restoreQueuedToWaiting(task.id)
          throw err
        }
      }
      catch (err) {
        this.logger.error(err, `Schedule enqueue failed for task ${task.id}`)
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async resolvePublishingTimeouts() {
    // Check for tasks stuck in Publishing status
    const cutoff = new Date(Date.now() - 30 * 60 * 1000) // 30 min timeout
    const staleTasks = await this.publishRecordRepo.getStalePublishingTasks(cutoff, 50)

    for (const task of staleTasks) {
      try {
        await this.taskService.processPublishingTimeout(task.id)
      }
      catch (err) {
        this.logger.error(err, `Timeout verify failed for task ${task.id}`)
      }
    }
  }

  private getScheduleWindow(platform: AccountType): number {
    return this.registry.get(platform).runtime.scheduleWindow ?? DEFAULT_SCHEDULE_WINDOW_MS
  }

  private getMaxScheduleWindow(): number {
    return Math.max(
      DEFAULT_SCHEDULE_WINDOW_MS,
      ...this.registry.listIntegrations().map(integration =>
        integration.runtime.scheduleWindow ?? DEFAULT_SCHEDULE_WINDOW_MS,
      ),
    )
  }
}
