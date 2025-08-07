import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { Account } from '../account/comment'
import { NatsApi } from '../api'

@Injectable()
export class PlatKwaiNatsApi {
  constructor(private readonly natsService: NatsService) {}

  // 获取页面的认证URL
  getAuth(data: { type: 'h5' | 'pc', userId: string }) {
    return this.natsService.sendMessage<{
      url: string
      taskId: string
    }>(NatsApi.plat.kwai.auth, data)
  }

  getAuthInfo(taskId: string) {
    return this.natsService.sendMessage<any>(NatsApi.plat.kwai.getAuthInfo, {
      taskId,
    })
  }

  createAccountAndSetAccessToken(data: {
    taskId: string
    code: string
    state: string
  }) {
    return this.natsService.sendMessage<Account>(
      NatsApi.plat.kwai.createAccountAndSetAccessToken,
      data,
    )
  }
}
