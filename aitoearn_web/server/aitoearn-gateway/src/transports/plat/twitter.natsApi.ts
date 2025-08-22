import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class PlatTwitterNatsApi extends BaseNatsApi {
  async getAuthUrl(userId: string, scopes?: string[]) {
    const res = await this.sendMessage<string>(
      NatsApi.plat.twitter.authUrl,
      {
        userId,
        scopes,
      },
    )
    return res
  }

  async getAuthInfo(taskId: string) {
    const res = await this.sendMessage<any>(
      NatsApi.plat.twitter.getAuthInfo,
      {
        taskId,
      },
    )

    return res
  }

  async createAccountAndSetAccessToken(
    code: string,
    state: string,
  ) {
    const res = await this.sendMessage<{
      status: 0 | 1
      message?: string
      accountId?: string
    }>(
      NatsApi.plat.twitter.createAccountAndSetAccessToken,
      {
        code,
        state,
      },
    )
    return res
  }
}
