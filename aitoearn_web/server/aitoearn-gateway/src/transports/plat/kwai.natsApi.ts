import { Injectable } from '@nestjs/common'
import { Account } from '../account/comment'
import { NatsApi } from '../api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class PlatKwaiNatsApi extends BaseNatsApi {
  // 获取页面的认证URL
  getAuth(data: { type: 'h5' | 'pc', userId: string }) {
    return this.sendMessage<{
      url: string
      taskId: string
    }>(NatsApi.plat.kwai.auth, data)
  }

  getAuthInfo(taskId: string) {
    return this.sendMessage<any>(NatsApi.plat.kwai.getAuthInfo, {
      taskId,
    })
  }

  createAccountAndSetAccessToken(data: {
    taskId: string
    code: string
    state: string
  }) {
    return this.sendMessage<Account>(
      NatsApi.plat.kwai.createAccountAndSetAccessToken,
      data,
    )
  }
}
