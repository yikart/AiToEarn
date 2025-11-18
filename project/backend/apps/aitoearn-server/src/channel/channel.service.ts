import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'
import { AccountService } from '../account/account.service'
import { ChannelApi } from '../transports/channel/channel.api'

@Injectable()
export class ChannelService {
  constructor(
    private readonly channelApi: ChannelApi,
    @Inject(forwardRef(() => AccountService))
    private readonly accountService: AccountService,
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

  async deletePost(accountId: string, userId: string, postId: string) {
    const account = await this.accountService.getAccountById(accountId)
    if (!account || account.userId !== userId) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    const res = await this.channelApi.deletePost(
      { accountId, platform: account.type, postId },
    )
    return res
  }
}
