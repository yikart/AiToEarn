import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Internal, Public } from '@yikart/aitoearn-auth'
import { AccountService } from './account.service'
import { AccountIdDto, AccountListByIdsDto, AccountListByParamDto, AccountListByTypesDto } from './dto/account.dto'

@ApiTags('频道(内部)')
@Internal()
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

  @ApiOperation({
    summary: '获取频道列表（by types)',
  })
  @Public()
  @Post('accountInternal/list/types')
  async getAccountListByTypes(
    @Body() body: AccountListByTypesDto,
  ) {
    return this.accountService.getAccountsByTypes(body.types, body.status)
  }

  @ApiOperation({
    summary: '获取频道列表（by param)',
  })
  @Public()
  @Post('accountInternal/list/param')
  async getAccountListByParam(
    @Body() body: AccountListByParamDto,
  ) {
    return this.accountService.getAccountByParam(body)
  }
}
