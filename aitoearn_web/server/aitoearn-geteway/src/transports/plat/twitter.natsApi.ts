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
    taskId: string,
    code: string,
    state: string,
  ) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.twitter.createAccountAndSetAccessToken,
      {
        taskId,
        code,
        state,
      },
    )
    return res
  }
}
