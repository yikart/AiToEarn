import { Body, Controller, Post } from '@nestjs/common'
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

  // @NatsMessagePattern('cloud-space.multilogin-account.create')
  @Post('cloud-space/multilogin-account/create')
  async create(@Body() createDto: CreateMultiloginAccountDto) {
    const account = await this.multiloginAccountService.create(createDto)
    return account
  }

  // @NatsMessagePattern('cloud-space.multilogin-account.list')
  @Post('cloud-space/multilogin-account/list')
  async list(@Body() listDto: ListMultiloginAccountsDto): Promise<MultiloginAccountListVo> {
    const [accounts, total] = await this.multiloginAccountService.listWithPagination(listDto)
    return new MultiloginAccountListVo(accounts, total, listDto)
  }

  // @NatsMessagePattern('cloud-space.multilogin-account.getById')
  @Post('cloud-space/multilogin-account/getById')
  async getById(@Body() getDto: IdDto): Promise<MultiloginAccountVo> {
    const account = await this.multiloginAccountService.getById(getDto.id)
    return MultiloginAccountVo.create(account)
  }

  // @NatsMessagePattern('cloud-space.multilogin-account.update')
  @Post('cloud-space/multilogin-account/update')
  async update(@Body() updateDto: UpdateMultiloginAccountDto): Promise<MultiloginAccountVo> {
    const account = await this.multiloginAccountService.update(updateDto)
    return MultiloginAccountVo.create(account)
  }

  // @NatsMessagePattern('multilogin-account.remove')
  @Post('cloud-space/multilogin-account/remove')
  async remove(@Body() removeDto: IdDto): Promise<void> {
    await this.multiloginAccountService.remove(removeDto.id)
  }
}
