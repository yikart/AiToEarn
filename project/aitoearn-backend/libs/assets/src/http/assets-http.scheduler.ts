import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { WithLoggerContext } from '@yikart/common'
import { Redlock } from '@yikart/redlock'
import { isCallbackEnabled, isQueueEnabled } from '../assets.config'
import { AssetsService } from '../assets.service'
import { R2EventsService } from '../r2-events.service'
import { ASSETS_HTTP_OPTIONS, AssetsHttpModuleOptions, AssetsRedlockKey } from './assets-http.options'

@Injectable()
export class AssetsHttpScheduler {
  private readonly logger = new Logger(AssetsHttpScheduler.name)
  private readonly queueEnabled: boolean
  private readonly callbackEnabled: boolean

  constructor(
    private readonly assetsService: AssetsService,
    private readonly r2EventsService: R2EventsService,
    @Inject(ASSETS_HTTP_OPTIONS) options: AssetsHttpModuleOptions,
  ) {
    this.queueEnabled = isQueueEnabled(options.assetsConfig)
    this.callbackEnabled = isCallbackEnabled(options.assetsConfig)
  }

  @Cron('*/5 * * * * *')
  @Redlock(AssetsRedlockKey.AssetsR2EventsProcess, 4, { throwOnFailure: false })
  @WithLoggerContext()
  async processAssetConfirmation() {
    if (this.queueEnabled) {
      const result = await this.r2EventsService.processMessages()
      if (result.processed > 0 || result.failed > 0) {
        this.logger.log(`R2 events: processed=${result.processed}, failed=${result.failed}`)
      }
    }
    else if (!this.callbackEnabled) {
      const result = await this.assetsService.processQuickPollPendingAssets(50)
      if (result.confirmed > 0) {
        this.logger.log(`Quick poll: confirmed=${result.confirmed}`)
      }
    }
  }

  @Cron('0 */5 * * * *')
  @Redlock(AssetsRedlockKey.AssetsPendingCheck, 60, { throwOnFailure: false })
  @WithLoggerContext()
  async processPendingAssets() {
    const result = await this.assetsService.processPendingAssets(120, 100)
    if (result.confirmed > 0 || result.failed > 0) {
      this.logger.log(`Pending assets: confirmed=${result.confirmed}, failed=${result.failed}`)
    }
  }

  @Cron('0 0 * * * *')
  @Redlock(AssetsRedlockKey.AssetsExpiredCleanup, 60, { throwOnFailure: false })
  @WithLoggerContext()
  async cleanupExpiredAssets() {
    const result = await this.assetsService.cleanupExpiredPendingAssets(24 * 60 * 60)
    if (result.affectedCount > 0) {
      this.logger.log(`Expired assets cleanup: ${result.affectedCount}`)
    }
  }
}
