import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { WithLoggerContext } from '@yikart/common'
import { Redlock } from '@yikart/redlock'
import { RedlockKey } from '../../common/enums'
import { DraftGenerationMemoryService } from './draft-generation-memory.service'

@Injectable()
export class DraftGenerationMemoryScheduler {
  private readonly logger = new Logger(DraftGenerationMemoryScheduler.name)

  constructor(
    private readonly draftGenerationMemoryService: DraftGenerationMemoryService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  @Redlock(RedlockKey.DraftGenerationMemoryRefresh, 3600, { throwOnFailure: false })
  @WithLoggerContext()
  async refreshDraftGenerationMemory() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    this.logger.debug({ since }, 'Refreshing draft generation memory')
    await this.draftGenerationMemoryService.refreshRecentUsers(since)
  }
}
