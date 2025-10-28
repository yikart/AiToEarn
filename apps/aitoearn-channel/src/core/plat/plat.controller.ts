import { Body, Controller, Logger, Param, Post } from '@nestjs/common'
import { AccountStatus } from '@yikart/aitoearn-server-client'
import { GenAuthURLDto } from './plat.dto'
import { PlatformService } from './plat.service'

@Controller()
export class PlatformController {
  private readonly logger = new Logger(PlatformController.name)
  constructor(private readonly platformService: PlatformService) {}

  // @NatsMessagePattern('platform.user.accounts')
  @Post('platform/user/accounts')
  async getUserAccounts(@Body() data: { userId: string }) {
    return await this.platformService.getUserAccounts(data.userId)
  }

  @Post('platform/:userId/accounts')
  async getUserAccountsByRestful(@Param('userId') userId: string) {
    return await this.platformService.getUserAccounts(userId)
  }

  // @NatsMessagePattern('platform.accounts.updateStatus')
  @Post('platform/accounts/updateStatus')
  async updateChannelStatus(@Body() data: { accountId: string, status: AccountStatus }) {
    return await this.platformService.updateAccountStatus(data.accountId, data.status)
  }

  // @NatsMessagePattern('platform.oauth.authorization.url')
  @Post('platform/oauth/authorization/url')
  async getAuthorizationUrl(@Body() data: GenAuthURLDto) {
    this.logger.debug(`Getting authorization URL for platform: ${data.platform}`)
    return await this.platformService.generateAuthorizationUrl(data)
  }
}
