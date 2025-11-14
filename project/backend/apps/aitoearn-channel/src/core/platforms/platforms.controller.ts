import { Body, Controller, Logger, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AccountStatus } from '@yikart/aitoearn-server-client'
import { ApiDoc } from '@yikart/common'
import { GenAuthURLDto } from './platforms.dto'
import { PlatformService } from './platforms.service'

@ApiTags('OpenSource/Core/Platforms/Platforms')
@Controller()
export class PlatformController {
  private readonly logger = new Logger(PlatformController.name)
  constructor(private readonly platformService: PlatformService) {}

  // @NatsMessagePattern('platform.user.accounts')
  @ApiDoc({
    summary: 'List User Accounts',
  })
  @Post('platform/user/accounts')
  async getUserAccounts(@Body() data: { userId: string }) {
    return await this.platformService.getUserAccounts(data.userId)
  }

  @ApiDoc({
    summary: 'List User Accounts (REST)',
  })
  @Post('platform/:userId/accounts')
  async getUserAccountsByRestful(@Param('userId') userId: string) {
    return await this.platformService.getUserAccounts(userId)
  }

  // @NatsMessagePattern('platform.accounts.updateStatus')
  @ApiDoc({
    summary: 'Update Account Status',
  })
  @Post('platform/accounts/updateStatus')
  async updateChannelStatus(@Body() data: { accountId: string, status: AccountStatus }) {
    return await this.platformService.updateAccountStatus(data.accountId, data.status)
  }

  // @NatsMessagePattern('platform.oauth.authorization.url')
  @ApiDoc({
    summary: 'Generate Authorization URL',
  })
  @Post('platform/oauth/authorization/url')
  async getAuthorizationUrl(@Body() data: GenAuthURLDto) {
    this.logger.debug(`Getting authorization URL for platform: ${data.platform}`)
    return await this.platformService.generateAuthorizationUrl(data)
  }
}
