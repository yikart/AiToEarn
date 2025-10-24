import { Body, Controller, Post } from '@nestjs/common'
import { AccountService } from './account.service'
import { AccountIdDto, AccountListByIdsDto } from './dto/account.dto'

@Controller()
export class AccountInternalController {
  constructor(private readonly accountService: AccountService) { }

  @Post('accountInternal/info')
  async getAccountInfoToTask(@Body() body: AccountIdDto) {
    return this.accountService.getAccountById(body.id)
  }

  @Post('accountInternal/list/ids')
  async getAccountListByIds(
    @Body() body: AccountListByIdsDto,
  ) {
    return this.accountService.getAccountListByIds(body.ids)
  }
}
