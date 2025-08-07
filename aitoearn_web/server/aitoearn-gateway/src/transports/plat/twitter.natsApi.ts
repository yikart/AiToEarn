import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'

@Injectable()
export class PlatTwitterNatsApi {
  constructor(private readonly natsService: NatsService) {}

  async getAuthUrl(userId: string, scopes?: string[]) {
    const res = await this.natsService.sendMessage<string>(
      NatsApi.plat.twitter.authUrl,
      {
        userId,
        scopes,
      },
    )
    return res
  }

  async getAuthInfo(taskId: string) {
    const res = await this.natsService.sendMessage<any>(
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
    const res = await this.natsService.sendMessage<{
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
