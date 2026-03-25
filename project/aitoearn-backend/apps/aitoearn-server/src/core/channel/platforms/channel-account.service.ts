import { Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { Account, AccountRepository, AccountStatus } from '@yikart/mongodb'

@Injectable()
export class ChannelAccountService {
  private readonly logger = new Logger(ChannelAccountService.name)
  constructor(
    private readonly accountRepository: AccountRepository,
  ) { }

  async createAccount(
    account: {
      type: AccountType
      uid: string
    },
    data: Partial<Account>,
  ) {
    const accountInfo = await this.accountRepository.createOrUpdateById({
      type: account.type,
      uid: account.uid,
    }, { ...data, loginTime: new Date() })
    return accountInfo
  }

  async updateAccountInfo(accountId: string, data: Partial<Account>) {
    return this.accountRepository.update(accountId, data)
  }

  async getAccountInfo(accountId: string) {
    return this.accountRepository.getById(accountId)
  }

  async getUserAccountList(userId: string) {
    return this.accountRepository.getUserAccountList(userId)
  }

  async getAccountByTypeAndUid(type: AccountType, uid: string) {
    return this.accountRepository.getAccountByUid(uid, type)
  }

  async listRelayAccountsByUserId(userId: string) {
    return this.accountRepository.listRelayAccountsByUserId(userId)
  }

  async updateAccountStatus(id: string, status: AccountStatus) {
    return this.accountRepository.update(id, { status })
  }
}
