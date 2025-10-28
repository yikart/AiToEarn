import { Injectable } from '@nestjs/common'
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
}
