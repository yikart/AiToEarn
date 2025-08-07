import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { AccountNatsApi } from 'src/transports/account/account.natsApi'
import {
  AccountIdDto,
  AccountListByIdsDto,
  AccountStatisticsDto,
  CreateAccountDto,
  DeleteAccountsDto,
  UpdateAccountDto,
  UpdateAccountStatisticsDto,
  UpdateAccountStatusDto,
} from './dto/account.dto'

@ApiTags('账户')
@Controller('account')
export class AccountController {
  constructor(private readonly accountNatsApi: AccountNatsApi) {}

  @ApiOperation({ summary: '创建账号' })
  @Post('login')
  // @ApiResult({ type: Account })
  async createOrUpdateAccount(
    @GetToken() token: TokenInfo,
    @Body() body: CreateAccountDto,
  ) {
    return await this.accountNatsApi.createAccount({
      userId: token.id,
      ...body,
    })
  }

  @ApiOperation({ summary: '更新账号' })
  @Post('update')
  // @ApiResult({ type: Account })
  async updateAccountInfo(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateAccountDto,
  ) {
    const res = await this.accountNatsApi.updateAccountInfo(body.id, {
      userId: token.id,
      ...body,
    })
    return res
  }

  @ApiOperation({ summary: '更新账号状态' })
  @Post('status')
  async updateAccountStatus(
    @Body() body: UpdateAccountStatusDto,
  ) {
    return this.accountNatsApi.updateAccountStatus(body.id, body.status)
  }

  @ApiOperation({ summary: '获取账号信息' })
  @Get(':id')
  async getAccountInfo(@Param() param: AccountIdDto) {
    return this.accountNatsApi.getAccountInfoById(param.id)
  }

  @ApiOperation({ summary: '获取用户所有账户' })
  @Get('list/all')
  async getUserAccounts(@GetToken() token: TokenInfo) {
    const res = await this.accountNatsApi.getUserAccounts(token.id)
    return res
  }

  @ApiOperation({ summary: '删除多个账户' })
  @Post('deletes')
  async deletes(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteAccountsDto,
  ) {
    return this.accountNatsApi.deleteAccounts(body.ids, token.id)
  }

  @ApiOperation({ summary: '获取账户列表' })
  @Post('list/ids')
  async getAccountListByIds(
    @GetToken() token: TokenInfo,
    @Query() query: AccountListByIdsDto,
  ) {
    return this.accountNatsApi.getAccountListByIds(token.id, query.ids)
  }

  @ApiOperation({ summary: '获取账户总数' })
  @Get('count')
  async getAccountCount(@GetToken() token: TokenInfo) {
    return this.accountNatsApi.getUserAccountCount(token.id)
  }

  @ApiOperation({ summary: '获取账户统计' })
  @Get('statistics')
  async getAccountStatistics(
    @GetToken() token: TokenInfo,
    @Query() query: AccountStatisticsDto,
  ) {
    return this.accountNatsApi.getAccountStatistics(token.id, query.type)
  }

  @ApiOperation({ summary: '删除账户' })
  @Post('delete/:id')
  async deleteAccount(
    @GetToken() token: TokenInfo,
    @Param() param: AccountIdDto,
  ) {
    return this.accountNatsApi.deleteAccount(param.id, token.id)
  }

  @ApiOperation({ summary: '更新账户统计信息' })
  @Post('statistics/update')
  async updateAccountStatistics(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateAccountStatisticsDto,
  ) {
    const {
      id,
      fansCount,
      readCount,
      likeCount,
      collectCount,
      commentCount,
      income,
      workCount,
    } = body
    return this.accountNatsApi.updateAccountStatistics(
      id,
      fansCount,
      readCount,
      likeCount,
      collectCount,
      commentCount,
      income,
      workCount,
    )
  }

  // @ApiOperation({ summary: 'Google登录' })
  // @Post('login/google')
  // @Public()
  // @ApiResult({ type: Account })
  // async googleLogin(
  //   @Body() body: GoogleLoginDto,
  // ) {
  //   // console.log(body.clientId, body.credential)
  //   return this.accountService.googleLogin(body.clientId, body.credential);
  // }
}
