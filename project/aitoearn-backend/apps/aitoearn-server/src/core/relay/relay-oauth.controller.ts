import { Body, Controller, Post, Query, Render } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { AccountType, ApiDoc, AppException, ChannelAuthTaskStatus, ParseObjectIdPipe, ResponseCode } from '@yikart/common'
import { ServerRedisService } from '../../common/redis'
import { AccountService } from '../channels/accounts/account.service'
import { RelayCallbackDto } from './relay-callback.dto'

interface RelayCallbackAccount {
  relayAccountRef: string
  nickname: string
  avatar?: string
  platformUid: string
  platform: AccountType
}

@ApiTags('Relay/OAuth')
@Controller('plat')
export class RelayOAuthController {
  constructor(
    private readonly accountService: AccountService,
    private readonly redisService: ServerRedisService,
  ) {}

  @Public()
  @ApiDoc({
    summary: 'Relay OAuth 回调',
    description: '接收官方服务器 OAuth 完成后浏览器 form POST 过来的账号信息，在本地创建 relay 账号',
    body: RelayCallbackDto.schema,
  })
  @Post('/relay-callback')
  @Render('channels/auth/callback')
  async handleRelayCallback(
    @Body() body: RelayCallbackDto,
    @Query('userId', ParseObjectIdPipe) userId: string,
  ) {
    if (!userId) {
      throw new AppException(ResponseCode.UserNotFound)
    }

    const relayAccounts = this.getRelayCallbackAccounts(body)
    const accounts: Array<{ id: string }> = []
    for (const relayAccount of relayAccounts) {
      const account = await this.accountService.createRelayAccount(userId, {
        type: relayAccount.platform,
        uid: relayAccount.platformUid,
        nickname: relayAccount.nickname,
        avatar: relayAccount.avatar,
        relayAccountRef: relayAccount.relayAccountRef,
      })
      if (account) {
        accounts.push(account)
      }
    }
    const accountIds = accounts.map(account => account.id)

    if (body.taskId && accountIds.length > 0) {
      const authTaskPlatform = this.getAuthTaskPlatform(relayAccounts[0].platform)
      await this.redisService.saveLegacyRelayAuthTask(authTaskPlatform, body.taskId, {
        status: ChannelAuthTaskStatus.Completed,
        accountId: accountIds[0],
        accountIds,
      })
    }

    return {
      status: 1,
      message: '授权成功',
      accountId: accountIds[0],
      accountIds,
      redirectUri: body.redirectUri,
    }
  }

  private getRelayCallbackAccounts(body: RelayCallbackDto): RelayCallbackAccount[] {
    if (body.accounts) {
      try {
        const accounts = JSON.parse(body.accounts) as RelayCallbackAccount[]
        if (Array.isArray(accounts) && accounts.length > 0) {
          const validAccounts = accounts.filter(account => (
            account.relayAccountRef
            && account.platformUid
            && account.platform
            && account.nickname
          ))
          if (validAccounts.length > 0) {
            return validAccounts
          }
        }
      }
      catch {
        // Fall back to legacy single-account fields below.
      }
    }

    return [{
      relayAccountRef: body.relayAccountRef,
      nickname: body.nickname,
      avatar: body.avatar,
      platformUid: body.platformUid,
      platform: body.platform,
    }]
  }

  private getAuthTaskPlatform(platform: string): string {
    const META_PLATFORMS = ['facebook', 'instagram', 'threads', 'linkedin']
    if (META_PLATFORMS.includes(platform)) {
      return 'meta'
    }
    return platform
  }
}
