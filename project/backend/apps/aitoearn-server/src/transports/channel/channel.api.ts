import { Injectable } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'
import { ChannelBaseApi } from '../channelBase.api'

@Injectable()
export class ChannelApi extends ChannelBaseApi {
  async getUserAccounts(payload: { userId: string }) {
    const res = await this.sendMessage<any>(
      `platform/${payload.userId}/accounts`,
      payload,
    )
    return res
  }

  async updateChannelAccountStatus(payload: {
    accountId: string
    status: AccountStatus
  }) {
    const res = await this.sendMessage<any>(
      `platform/accounts/updateStatus`,
      payload,
    )
    return res
  }

  async getPublishTaskInfoWithFlowId(payload: { flowId: string, userId: string }) {
    const res = await this.sendMessage<any>(
      `channel/publishTask/detail`,
      payload,
    )
    return res
  }

  async deletePost(payload: {
    accountId: string
    platform: AccountType
    postId: string
  }) {
    const res = await this.sendMessage<any>(
      `platform/post/delete`,
      payload,
    )
    return res
  }
}
