import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import { AccountService } from './account.service'
import { AccountListFilterDto } from './dto/account.dto'

@ApiTags('账户')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * 获取所有账户
   * @param param
   * @param query
   * @returns
   */
  @Get('list/:pageNo/:pageSize')
  async list(
    @Param() param: TableDto,
    @Query() query: AccountListFilterDto,
  ) {
    const res = await this.accountService.getAccountList(query, param)
    return res
  }
}
