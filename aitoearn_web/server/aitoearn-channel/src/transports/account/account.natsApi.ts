import { Injectable } from '@nestjs/common'
import { NatsApi } from '../api'
import { NatsService } from '../nats.service'
import { Account, AccountType, NewAccount } from './common'

@Injectable()
export class AccountNatsApi {
  constructor(private readonly natsService: NatsService) {}

  /**
   * 创建账户
   * @param account
   * @param data
   * @returns
   */
  async createAccount(
    account: {
      userId: string
      type: AccountType
      uid: string
    },
    data: NewAccount,
    accountAddPath?: string,
  ) {
    return await this.natsService.sendMessage<Account>(
      accountAddPath || NatsApi.account.account.create,
      { account, data },
    )
  }

  // 更新账号信息
  async updateAccountInfo(accountId: string, data: Partial<NewAccount>) {
    return await this.natsService.sendMessage<Account>(
      NatsApi.account.account.updateAccountInfo,
      { id: accountId, data },
    )
  }

  /**
   * 获取账户ID
   * @param accountId
   * @returns
   */
  async getAccountInfo(accountId: string) {
    return await this.natsService.sendMessage<Account>(
      NatsApi.account.account.getAccountInfo,
      { accountId },
    )
  }
}
