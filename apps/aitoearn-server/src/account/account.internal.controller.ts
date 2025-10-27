import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AccountService } from './account.service'
import { AccountIdDto, AccountListByIdsDto } from './dto/account.dto'

@ApiTags('频道(内部)')
@Controller()
export class AccountInternalController {
  constructor(private readonly accountService: AccountService) { }

  @ApiOperation({
    summary: '获取频道信息',
  })
  @Post('accountInternal/info')
  async getAccountInfoToTask(@Body() body: AccountIdDto) {
    return this.accountService.getAccountById(body.id)
  }

  @ApiOperation({
    summary: '获取频道列表（by ids）',
  })
  @Post('accountInternal/list/ids')
  async getAccountListByIds(
    @Body() body: AccountListByIdsDto,
  ) {
    return this.accountService.getAccountListByIds(body.ids)
  }
}
