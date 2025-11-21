import { Injectable, Logger } from '@nestjs/common'
import { AccountRepository } from '@yikart/mongodb'

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name)
  constructor(
    private readonly accountRepository: AccountRepository,
  ) { }

  async getAccountById(id: string) {
    return await this.accountRepository.getAccountById(id)
  }

  async getUserAccountList(userId: string) {
    return await this.accountRepository.getUserAccounts(userId)
  }

  async getAccountListByIds(accountIds: string[]) {
    return await this.accountRepository.getAccountListByIds(accountIds)
  }
}
