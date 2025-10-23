import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AdminAccountRepository } from '@yikart/mongodb'
import { AccountListFilterDto } from './dto/account.dto'

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AdminAccountRepository,
  ) { }

  getAccountList(inFilter: AccountListFilterDto, pageInfo: TableDto) {
    return this.accountRepository.getAccountList(inFilter, pageInfo)
  }
}
