import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { AccountType, ApiDoc } from '@yikart/common'
import { PlatformService } from '../platforms/platforms.service'

@ApiTags('Internal/Channel')
@Controller()
@Internal()
export class ChannelInternalController {
  constructor(private readonly platformService: PlatformService) {}

  @ApiDoc({
    summary: 'Get Work Link Info',
  })
  @Post('internal/channel/work/link/info')
  async getWorkLinkInfo(@Body() data: { accountType: AccountType, workLink: string, dataId?: string, accountId?: string }) {
    return await this.platformService.getWorkLinkInfo(data.accountType, data.workLink, data.dataId, data.accountId)
  }

  @ApiDoc({
    summary: 'Get Work Detail',
  })
  @Post('internal/channel/work/detail')
  async getWorkDetail(@Body() data: { accountType: AccountType, accountId: string, dataId: string }) {
    return await this.platformService.getWorkDetail(data.accountType, data.accountId, data.dataId)
  }

  @ApiDoc({
    summary: 'Verify Work Ownership',
  })
  @Post('internal/channel/work/verify-ownership')
  async verifyWorkOwnership(@Body() data: { accountType: AccountType, accountId: string, dataId: string }) {
    return await this.platformService.verifyWorkOwnership(data.accountType, data.accountId, data.dataId)
  }
}
