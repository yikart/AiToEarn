import { Body, Controller, Logger, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AccountStatus } from '@yikart/aitoearn-server-client'
import { AccountType, ApiDoc } from '@yikart/common'
import { PlatformService } from './platforms.service'

@ApiTags('OpenSource/Core/Platforms/Platforms')
@Controller()
export class PlatformController {
  private readonly logger = new Logger(PlatformController.name)
  constructor(private readonly platformService: PlatformService) {}

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

  @ApiDoc({
    summary: 'Update Account Status',
  })
  @Post('platform/accounts/updateStatus')
  async updateChannelStatus(@Body() data: { accountId: string, status: AccountStatus }) {
    return await this.platformService.updateAccountStatus(data.accountId, data.status)
  }

  @ApiDoc({
    summary: 'Delete Post',
  })
  @Post('platform/post/delete')
  async deletePost(@Body() data: { accountId: string, platform: AccountType, postId: string }) {
    return await this.platformService.deletePost(data.accountId, data.platform, data.postId)
  }
}
