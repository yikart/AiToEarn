import { Injectable } from '@nestjs/common'
<<<<<<< HEAD
import { Account } from '@yikart/mongodb'
=======
>>>>>>> origin/merge
import { ChannelBaseApi } from '../../channelBase.api'

@Injectable()
export class PlatKwaiNatsApi extends ChannelBaseApi {
  // 获取页面的认证URL
  async getAuth(data: { type: 'h5' | 'pc', userId: string, spaceId: string }) {
    const res = await this.sendMessage<{
      url: string
      taskId: string
    }>(
      `plat/kwai/auth`,
      data,
    )
    return res
  }

  async getAuthInfo(taskId: string) {
    const res = await this.sendMessage<any>(
      `plat/kwai/getAuthInfo`,
      {
        taskId,
      },
    )
    return res
  }

  async createAccountAndSetAccessToken(data: {
    taskId: string
    code: string
    state: string
  }) {
<<<<<<< HEAD
    const res = await this.sendMessage<Account>(
=======
    const res = await this.sendMessage<{
      status: 0 | 1
      message?: string
      accountId?: string
    }>(
>>>>>>> origin/merge
      `plat/kwai/createAccountAndSetAccessToken`,
      data,
    )
    return res
  }
}
