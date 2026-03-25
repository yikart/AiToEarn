import { Body, Controller, Post, Query, Render } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'
import { ChannelRedisKeys } from '../channel/channel.constants'
import { ChannelAccountService } from '../channel/platforms/channel-account.service'
import { RelayCallbackDto } from './relay-callback.dto'

@ApiTags('Relay/OAuth')
@Controller('plat')
export class RelayOAuthController {
  constructor(
    private readonly channelAccountService: ChannelAccountService,
    private readonly redisService: RedisService,
  ) {}

  @Public()
  @ApiDoc({
    summary: 'Relay OAuth 回调',
    description: '接收官方服务器 OAuth 完成后浏览器 form POST 过来的账号信息，在本地创建 relay 账号',
    body: RelayCallbackDto.schema,
  })
  @Post('/relay-callback')
  @Render('auth/back')
  async handleRelayCallback(
    @Body() body: RelayCallbackDto,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    const account = await this.channelAccountService.createAccount(
      { type: body.accountType, uid: body.platformUid },
      {
        userId,
        type: body.accountType,
        uid: body.platformUid,
        nickname: body.nickname,
        avatar: body.avatar,
        status: AccountStatus.NORMAL,
        relayAccountRef: body.relayAccountRef,
      },
    )

    if (body.taskId) {
      const authTaskPlatform = this.getAuthTaskPlatform(body.accountType)
      await this.redisService.setJson(
        ChannelRedisKeys.authTask(authTaskPlatform, body.taskId),
        { status: 1, accountId: account?.id },
        600,
      )
    }

    return { status: 1, message: '授权成功', accountId: account?.id }
  }

  private getAuthTaskPlatform(accountType: string): string {
    const META_PLATFORMS = ['facebook', 'instagram', 'threads', 'linkedin']
    if (META_PLATFORMS.includes(accountType)) {
      return 'meta'
    }
    return accountType
  }
}
