import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'

@Injectable()
export class PlatMetaNatsApi {
  constructor(private readonly natsService: NatsService) {}

  async getAuthUrl(userId: string, platform: string) {
    const res = await this.natsService.sendMessage<string>(
      NatsApi.plat.meta.authUrl,
      {
        userId,
        platform,
      },
    )
    return res
  }

  async getAuthInfo(taskId: string) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.meta.getAuthInfo,
      {
        taskId,
      },
    )

    return res
  }

  async getFacebookPages(userId: string) {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.plat.meta.getFacebookPages,
      {
        userId,
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
      NatsApi.plat.meta.createAccountAndSetAccessToken,
      {
        taskId,
        code,
        state,
      },
    )
    return res
  }
}
