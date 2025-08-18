import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import {
  CreateMultiloginAccountDto,
  IdDto,
  ListMultiloginAccountsDto,
  UpdateMultiloginAccountDto,
} from './multilogin-account.dto'
import { MultiloginAccountService } from './multilogin-account.service'

@Controller()
export class MultiloginAccountController {
  constructor(
    private readonly multiloginAccountService: MultiloginAccountService,
  ) {}

  @MessagePattern('multilogin-account.create')
  async create(@Payload() createDto: CreateMultiloginAccountDto) {
    return await this.multiloginAccountService.create(createDto)
  }

  @MessagePattern('multilogin-account.list')
  async list(@Payload() listDto: ListMultiloginAccountsDto) {
    return await this.multiloginAccountService.findWithPagination(listDto)
  }

  @MessagePattern('multilogin-account.getById')
  async getById(@Payload() getDto: IdDto) {
    return await this.multiloginAccountService.findById(getDto.id)
  }

  @MessagePattern('multilogin-account.update')
  async update(@Payload() updateDto: UpdateMultiloginAccountDto) {
    return await this.multiloginAccountService.update(updateDto)
  }

  @MessagePattern('multilogin-account.remove')
  async remove(@Payload() removeDto: IdDto) {
    return await this.multiloginAccountService.remove(removeDto.id)
  }
}
