import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'
import { AccountService } from '../account/account.service'
import { RelayAccountException } from '../relay/relay-account.exception'
import { PlatformService } from './platforms/platforms.service'

@Injectable()
export class ChannelService {
  constructor(
    private readonly platformsService: PlatformService,
    private readonly accountService: AccountService,
  ) { }

  /**
   * 获取用户账号列表
   * @param userId
   */
  async getUserAccounts(userId: string) {
    const res = await this.platformsService.getUserAccounts(userId)
    return res
  }

  async updateChannelAccountStatus(accountId: string, status: AccountStatus) {
    const res = await this.platformsService.updateAccountStatus(accountId, status)
    return res
  }

  async deletePost(accountId: string, userId: string, postId: string) {
    const account = await this.accountService.getAccountById(accountId)
    if (!account || account.userId !== userId) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    try {
      const res = await this.platformsService.deletePost(accountId, account.type, postId)
      return res
    }
    catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      throw new AppException(ResponseCode.DeletePostFailed, 'Unknown error')
    }
  }
}
