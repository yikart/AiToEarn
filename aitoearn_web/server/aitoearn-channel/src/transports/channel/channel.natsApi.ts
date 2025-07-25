import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { NatsService } from '../nats.service'
import { Account } from './common'

@Injectable()
export class ChannelNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 创建账户
   * @param account
   * @param data
   * @returns
   */
  async createAccountAndSetAccessToken(
    taskId: string,
    authInfo: {
      auth_code: string
      expires_in: number
    },
    transpond?: string,
  ) {
    const res = await this.natsService.sendMessage<Account>(
      NatsApi.channel.wxPlat.createAccountAndSetAccessToken,
      { taskId, ...authInfo,
      },
      transpond,
    )
    return res
  }
}
