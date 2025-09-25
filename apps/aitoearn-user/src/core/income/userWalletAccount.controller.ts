import { Controller, Logger } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import { CreateUserWalletAccountDto, UpdateUserWalletAccountDto, UserWalletAccountIdDto, UserWalletAccountListDto } from './userWalletAccount.dto'
import { UserWalletAccountService } from './userWalletAccount.service'

@Controller()
export class UserWalletAccountController {
  private readonly logger = new Logger(UserWalletAccountController.name)

  constructor(private readonly userWalletAccountService: UserWalletAccountService) {}

  @NatsMessagePattern('user.userWalletAccount.create')
  async create(@Payload() data: CreateUserWalletAccountDto) {
    const res = await this.userWalletAccountService.create(data)
    return res
  }

  @NatsMessagePattern('user.userWalletAccount.delete')
  async delete(@Payload() data: UserWalletAccountIdDto) {
    const res = await this.userWalletAccountService.delete(data.id)
    return res
  }

  @NatsMessagePattern('user.userWalletAccount.update')
  async update(@Payload() data: UpdateUserWalletAccountDto) {
    const res = await this.userWalletAccountService.update(data)
    return res
  }

  @NatsMessagePattern('user.userWalletAccount.info')
  async info(@Payload() data: UserWalletAccountIdDto) {
    const res = await this.userWalletAccountService.info(data)
    return res
  }

  @NatsMessagePattern('user.userWalletAccount.list')
  async list(@Payload() data: UserWalletAccountListDto) {
    const res = await this.userWalletAccountService.list(data.page, data.filter)
    return res
  }
}
