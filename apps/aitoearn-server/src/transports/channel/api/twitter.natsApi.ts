import { Injectable } from '@nestjs/common'
import { ChannelBaseApi } from '../../channelBase.api'

@Injectable()
export class PlatTwitterNatsApi extends ChannelBaseApi {
  async getAuthUrl(userId: string, scopes?: string[], spaceId?: string) {
    const res = await this.sendMessage<string>(
      `plat/twitter/authUrl`,
      {
        userId,
        scopes,
        spaceId: spaceId || '',
      },
    )
    return res
  }

  async getAuthInfo(taskId: string) {
    const res = await this.sendMessage<any>(
      `plat/twitter/getAuthInfo`,
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
      `plat/twitter/createAccountAndSetAccessToken`,
      {
        code,
        state,
      },
    )
    return res
  }
}
