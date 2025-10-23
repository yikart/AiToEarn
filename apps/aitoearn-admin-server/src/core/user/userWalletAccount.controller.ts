import { Body, Controller, Delete, Get, Param, Put, Query } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { UpdateUserWalletAccountDto, UserWalletAccountListFilterDto } from './dto/userWalletAccount.dto'
import { UserWalletAccountService } from './userWalletAccount.service'

@Controller('userWalletAccount')
export class UserWalletAccountController {
  constructor(private readonly userWalletAccountService: UserWalletAccountService) {}

  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ) {
    const res = await this.userWalletAccountService.delete(id)
    return res
  }

  @Put('')
  async update(
    @Body() body: UpdateUserWalletAccountDto,
  ) {
    const res = await this.userWalletAccountService.update(body)
    return res
  }

  @Get('info/:id')
  async info(
    @Param('id') id: string,
  ) {
    const res = await this.userWalletAccountService.info(id)
    return res
  }

  @Get('list/:pageNo/:pageSize')
  list(@Param() params: TableDto, @Query() query: UserWalletAccountListFilterDto) {
    return this.userWalletAccountService.list(params, query)
  }
}
