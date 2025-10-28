import { Injectable } from '@nestjs/common'
import { AccountStatus } from '@yikart/mongodb'
import { ChannelBaseApi } from '../channelBase.api'

@Injectable()
export class ChannelApi extends ChannelBaseApi {
  async getUserAccounts(payload: { userId: string }) {
    const res = await this.sendMessage<any>(
<<<<<<< HEAD
      `account/portrait/report`,
=======
      `platform/${payload.userId}/accounts`,
>>>>>>> origin/merge
      payload,
    )
    return res
  }

  async updateChannelAccountStatus(payload: {
<<<<<<< HEAD
    userId: string
    status: AccountStatus
  }) {
    const res = await this.sendMessage<any>(
      `account/portrait/report`,
=======
    accountId: string
    status: AccountStatus
  }) {
    const res = await this.sendMessage<any>(
      `platform/accounts/updateStatus`,
>>>>>>> origin/merge
      payload,
    )
    return res
  }
}
