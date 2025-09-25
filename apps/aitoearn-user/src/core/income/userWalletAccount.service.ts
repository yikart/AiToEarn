import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode, TableDto } from '@yikart/common'
import { UserWalletAccountRepository } from '@yikart/mongodb'
import { CreateUserWalletAccountDto, UpdateUserWalletAccountDto, UserWalletAccountIdDto } from './userWalletAccount.dto'

@Injectable()
export class UserWalletAccountService {
  private readonly logger = new Logger(UserWalletAccountService.name)

  constructor(
    private readonly userWalletAccountRepository: UserWalletAccountRepository,
  ) {}

  async create(data: CreateUserWalletAccountDto) {
    const exist = await this.userWalletAccountRepository.getByUserIdTypeAndAccount(data.userId, data.type, data.account)
    if (exist) {
      throw new AppException(ResponseCode.UserWalletAccountAlreadyExists)
    }

    const num = await this.userWalletAccountRepository.countByUserId(data.userId)
    if (num >= 50) {
      throw new AppException(ResponseCode.UserWalletAccountLimitExceeded)
    }

    return await this.userWalletAccountRepository.create(data)
  }

  async delete(id: string) {
    await this.userWalletAccountRepository.deleteById(id)
  }

  async update(data: UpdateUserWalletAccountDto) {
    return await this.userWalletAccountRepository.updateById(data.id, data)
  }

  async info(data: UserWalletAccountIdDto) {
    return await this.userWalletAccountRepository.getById(data.id)
  }

  async list(pageInfo: TableDto, query: {
    userId?: string
  }) {
    const { pageSize, pageNo } = pageInfo
    const { userId } = query

    return await this.userWalletAccountRepository.listWithPagination({
      page: pageNo,
      pageSize,
      userId,
    })
  }
}
