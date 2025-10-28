import { Injectable } from '@nestjs/common'
import { AccountStatus } from '@yikart/mongodb'
import { ChannelApi } from '../transports/channel/channel.api'

@Injectable()
export class ChannelService {
  constructor(
    private readonly channelApi: ChannelApi,
  ) { }

  /**
   * 获取用户账号列表
   * @param userId
   */
  async getUserAccounts(userId: string) {
    const res = await this.channelApi.getUserAccounts(
      { userId },
    )
    return res
  }

  async updateChannelAccountStatus(accountId: string, status: AccountStatus) {
    const res = await this.channelApi.updateChannelAccountStatus(
      { accountId, status },
    )
    return res
  }
}
