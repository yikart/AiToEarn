import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
import {
  CreateMultiloginAccountDto,
  IdDto,
  ListMultiloginAccountsDto,
  UpdateMultiloginAccountDto,
} from './multilogin-account.dto'
import { MultiloginAccountService } from './multilogin-account.service'
import {
  MultiloginAccountListVo,
  MultiloginAccountVo,
} from './multilogin-account.vo'

@Controller()
export class MultiloginAccountController {
  constructor(
    private readonly multiloginAccountService: MultiloginAccountService,
  ) {}

  @NatsMessagePattern('multilogin-account.create')
  async create(@Payload() createDto: CreateMultiloginAccountDto): Promise<MultiloginAccountVo> {
    const account = await this.multiloginAccountService.create(createDto)
    return MultiloginAccountVo.create(account)
  }

  @NatsMessagePattern('multilogin-account.list')
  async list(@Payload() listDto: ListMultiloginAccountsDto): Promise<MultiloginAccountListVo> {
    const [accounts, total] = await this.multiloginAccountService.listWithPagination(listDto)
    return new MultiloginAccountListVo(accounts, total, listDto)
  }

  @NatsMessagePattern('multilogin-account.getById')
  async getById(@Payload() getDto: IdDto): Promise<MultiloginAccountVo> {
    const account = await this.multiloginAccountService.getById(getDto.id)
    return MultiloginAccountVo.create(account)
  }

  @NatsMessagePattern('multilogin-account.update')
  async update(@Payload() updateDto: UpdateMultiloginAccountDto): Promise<MultiloginAccountVo> {
    const account = await this.multiloginAccountService.update(updateDto)
    return MultiloginAccountVo.create(account)
  }

  @NatsMessagePattern('multilogin-account.remove')
  async remove(@Payload() removeDto: IdDto): Promise<void> {
    await this.multiloginAccountService.remove(removeDto.id)
  }
}
