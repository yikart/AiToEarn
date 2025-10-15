import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from '../auth/auth.guard'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { AccountService } from './account.service'
import {
  AccountIdDto,
  AccountListByIdsDto,
  AccountListBySpaceIdsDto,
  AccountStatisticsDto,
  CreateAccountDto,
  DeleteAccountsDto,
  SortRankDto,
  UpdateAccountDto,
  UpdateAccountStatisticsDto,
  UpdateAccountStatusDto,
} from './dto/account.dto'

@ApiTags('账户')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @ApiOperation({ summary: '创建账号' })
  @Post('login')
  async createOrUpdateAccount(
    @GetToken() token: TokenInfo,
    @Body() body: CreateAccountDto,
  ) {
    return await this.accountService.addAccount({
      ...body,
      userId: token.id,
    })
  }

  @ApiOperation({ summary: '更新账号' })
  @Post('update')
  async updateAccountInfo(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateAccountDto,
  ) {
    const res = await this.accountService.updateAccountInfoById(body.id, {
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
    return this.accountService.updateAccountStatus(body.id, body.status)
  }

  @ApiOperation({ summary: '获取账号信息' })
  @Get(':id')
  async getAccountInfo(@Param() param: AccountIdDto) {
    return this.accountService.getAccountById(param.id)
  }

  @ApiOperation({ summary: '获取用户所有账户' })
  @Get('list/all')
  async getUserAccounts(@GetToken() token: TokenInfo) {
    const res = await this.accountService.getUserAccounts(token.id)
    return res
  }

  @ApiOperation({ summary: '删除多个账户' })
  @Post('deletes')
  async deletes(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteAccountsDto,
  ) {
    return this.accountService.deleteUserAccounts(body.ids, token.id)
  }

  @ApiOperation({ summary: '获取账户列表' })
  @Post('list/ids')
  async getAccountListByIds(
    @GetToken() token: TokenInfo,
    @Query() query: AccountListByIdsDto,
  ) {
    return this.accountService.getAccountListByIds(token.id, query.ids)
  }

  @ApiOperation({ summary: '获取账户总数' })
  @Get('count')
  async getAccountCount(@GetToken() token: TokenInfo) {
    return this.accountService.getUserAccountCount(token.id)
  }

  @ApiOperation({ summary: '获取账户统计' })
  @Get('statistics')
  async getAccountStatistics(
    @GetToken() token: TokenInfo,
    @Query() query: AccountStatisticsDto,
  ) {
    return this.accountService.getAccountStatistics(token.id, query.type)
  }

  @ApiOperation({ summary: '删除账户' })
  @Post('delete/:id')
  async deleteAccount(
    @GetToken() token: TokenInfo,
    @Param() param: AccountIdDto,
  ) {
    return this.accountService.deleteUserAccount(param.id, token.id)
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
    return this.accountService.updateAccountStatistics(
      id,
      {
        fansCount,
        readCount,
        likeCount,
        collectCount,
        commentCount,
        income,
        workCount,
      },
    )
  }

  @ApiOperation({ summary: '获取账户列表（根据空间ids）' })
  @Post('list/spaceIds')
  async getAccountListBySpaceIds(
    @GetToken() token: TokenInfo,
    @Query() query: AccountListBySpaceIdsDto,
  ) {
    return this.accountService.listBySpaceIds(query.spaceIds)
  }

  @ApiOperation({ summary: '更新排序' })
  @Put('sortRank')
  async sortRank(
    @GetToken() token: TokenInfo,
    @Body() body: SortRankDto,
  ) {
    return this.accountService.sortRank(token.id, body.groupId, body.list)
  }
}
