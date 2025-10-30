import { Injectable, Logger } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { UserWalletAccountRepository } from '@yikart/mongodb'
import { CreateUserWalletAccountDto, UpdateUserWalletAccountDto } from './dto/userWalletAccount.dto'

@Injectable()
export class UserWalletAccountService {
  private readonly logger = new Logger(UserWalletAccountService.name)

  constructor(
    private readonly userWalletAccountRepository: UserWalletAccountRepository,
  ) { }

  async create(userId: string, data: CreateUserWalletAccountDto) {
    return this.userWalletAccountRepository.create({ userId, ...data })
  }

  async delete(id: string) {
    return this.userWalletAccountRepository.delete(id)
  }

  async update(data: UpdateUserWalletAccountDto) {
    return this.userWalletAccountRepository.update(data.id, data)
  }

  async info(id: string) {
    return this.userWalletAccountRepository.info(id)
  }

  async list(page: TableDto, query: {
    userId?: string
  }) {
    return this.userWalletAccountRepository.list(page, query)
  }
}
