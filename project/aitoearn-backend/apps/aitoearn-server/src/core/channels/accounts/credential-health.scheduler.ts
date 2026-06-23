import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AuthService } from '../auth/auth.service'
import { CredentialService } from './credential.service'

@Injectable()
export class CredentialHealthScheduler {
  private readonly logger = new Logger(CredentialHealthScheduler.name)

  constructor(
    private readonly credentialService: CredentialService,
    private readonly authService: AuthService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async refreshExpiringCredentials() {
    const now = Math.floor(Date.now() / 1000)
    const threshold = now + 3600 // 1 hour from now
    const batchSize = 100
    let successCount = 0
    let failureCount = 0
    let skippedCount = 0
    let processedCount = 0
    let cursor: { accessTokenExpiresAt: number, cursorId: unknown } | undefined

    while (true) {
      const expiring = await this.credentialService.listExpiringCredentials(threshold, batchSize, cursor)
      if (expiring.length === 0) {
        break
      }

      processedCount += expiring.length
      for (const cred of expiring) {
        try {
          const refreshed = await this.authService.tryRefreshCredential(cred.accountId)
          if (refreshed) {
            successCount++
            this.logger.debug(`Refreshed credential for account ${cred.accountId}`)
          }
          else {
            skippedCount++
          }
        }
        catch (err) {
          failureCount++
          this.logger.error(err, `Failed to refresh credential for account ${cred.accountId}`)
        }
      }

      const last = expiring[expiring.length - 1]
      cursor = {
        accessTokenExpiresAt: last.accessTokenExpiresAt,
        cursorId: last.cursorId,
      }
    }

    this.logger.log({
      threshold,
      batchSize,
      processedCount,
      successCount,
      failureCount,
      skippedCount,
    }, 'Refreshed expiring channel credentials')
  }
}
