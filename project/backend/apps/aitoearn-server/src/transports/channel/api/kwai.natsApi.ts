import { Injectable } from '@nestjs/common'
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
    const res = await this.sendMessage<{
      status: 0 | 1
      message?: string
      accountId?: string
    }>(
      `plat/kwai/createAccountAndSetAccessToken`,
      data,
    )
    return res
  }

  async getAuthorInfo(data: { accountId: string }) {
    const res = await this.sendMessage<any>(
      `plat/kwai/getAuthorInfo`,
      data,
    )
    return res
  }
}
