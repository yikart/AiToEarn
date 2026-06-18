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

    const expiring = await this.credentialService.listExpiringCredentials(threshold, 100)
    this.logger.log(`Found ${expiring.length} expiring credentials`)

    for (const cred of expiring) {
      try {
        await this.authService.refreshCredential(cred.accountId)
        this.logger.debug(`Refreshed credential for account ${cred.accountId}`)
      }
      catch (err) {
        this.logger.error(err, `Failed to refresh credential for account ${cred.accountId}`)
      }
    }
  }
}
