import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { WithLoggerContext } from '@yikart/common'
import { Redlock } from '@yikart/redlock'
import { RedlockKey } from '../../../../common/enums'
import { PUBLISHING_STATUS_WATCHDOG_CRON_EXPRESSION } from '../constant'
import { PublishingService } from '../publishing.service'

@Injectable()
export class PublishingStatusWatchdogScheduler {
  private readonly logger = new Logger(PublishingStatusWatchdogScheduler.name)

  constructor(
    private readonly publishingService: PublishingService,
  ) {}

  @Cron(PUBLISHING_STATUS_WATCHDOG_CRON_EXPRESSION, { waitForCompletion: true })
  @Redlock(RedlockKey.PublishingTaskTimeoutCheck, 600, { throwOnFailure: false })
  @WithLoggerContext()
  async reconcileStalePublishingTasks() {
    this.logger.log(`Start publishing status watchdog, current time: ${new Date().toISOString()}`)
    try {
      await this.publishingService.reconcileStalePublishingTasks()
    }
    catch (error) {
      this.logger.error(error, 'Error reconciling stale publishing tasks')
    }
  }
}
