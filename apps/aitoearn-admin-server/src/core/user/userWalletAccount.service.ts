import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { UserWalletAccountRepository } from '@yikart/mongodb'
import { UpdateUserWalletAccountDto } from './dto/userWalletAccount.dto'

@Injectable()
export class UserWalletAccountService {
  constructor(
    private readonly UserWalletAccountRepository: UserWalletAccountRepository,
  ) {}

  async delete(id: string) {
    return this.UserWalletAccountRepository.delete(id)
  }

  async update(data: UpdateUserWalletAccountDto) {
    return this.UserWalletAccountRepository.update(data.id, data)
  }

  async info(id: string) {
    return this.UserWalletAccountRepository.info(id)
  }

  async list(page: TableDto, query: {
    userId?: string
  }) {
    return this.UserWalletAccountRepository.list(page, query)
  }
}
