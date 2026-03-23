import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'
import { ChannelAccountService } from '../channel/platforms/channel-account.service'
import { RelayCallbackDto } from './relay-callback.dto'

@ApiTags('Relay/OAuth')
@Controller('plat')
export class RelayOAuthController {
  constructor(
    private readonly channelAccountService: ChannelAccountService,
  ) {}

  @Public()
  @ApiDoc({
    summary: 'Relay OAuth 回调',
    description: '接收官方服务器 OAuth 完成后 POST 过来的账号信息，在本地创建 relay 账号',
    body: RelayCallbackDto.schema,
  })
  @Post('/relay-callback')
  async handleRelayCallback(@Body() body: RelayCallbackDto) {
    const account = await this.channelAccountService.createAccount(
      { type: body.accountType, uid: body.platformUid },
      {
        userId: body.userId,
        type: body.accountType,
        uid: body.platformUid,
        nickname: body.nickname,
        avatar: body.avatar,
        status: AccountStatus.NORMAL,
        relayAccountRef: body.relayAccountRef,
      },
    )
    return { accountId: account?.id }
  }
}
