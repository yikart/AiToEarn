import { Injectable, Logger } from '@nestjs/common'
import { QueueService } from '@yikart/aitoearn-queue'
import { MetricEventNameValue, MetricEventRecordInput } from './metric-event.types'

@Injectable()
export class MetricEventHelperService {
  private readonly logger = new Logger(MetricEventHelperService.name)

  constructor(
    private readonly queueService: QueueService,
  ) {}

  async record(userId: string, event: MetricEventNameValue, extra?: MetricEventRecordInput): Promise<void> {
    try {
      await this.queueService.addUserEventBatchJob({
        events: [
          {
            userId,
            event,
            properties: extra?.properties,
            bizKey: extra?.bizKey,
            source: extra?.source ?? 'backend',
            timestamp: extra?.timestamp ?? Date.now(),
          },
        ],
      })
    }
    catch (error) {
      this.logger.error(error, `Failed to enqueue metric event: ${event}`)
    }
  }
}
