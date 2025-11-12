import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { AppException, ResponseCode } from '@yikart/common'
import { fileUtil } from '../util/file.util'
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
    const res = await this.accountService.addAccount(token.id, {
      ...body,
    })
    if (!res) {
      throw new AppException(ResponseCode.AccountNotFound, 'Create account failed.')
    }
    res.avatar = fileUtil.buildUrl(res.avatar)
    return res
  }

  @ApiOperation({ summary: '更新账号' })
  @Post('update')
  async updateAccountInfo(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateAccountDto,
  ) {
    const account = await this.accountService.getAccountById(body.id)
    if (!account || account.userId !== token.id) {
      throw new AppException(ResponseCode.AccountNotFound, 'The account does not exist.')
    }
    const res = await this.accountService.updateAccountInfoById(body.id, {
      userId: token.id,
      ...body,
    })
    return res
  }

  @ApiOperation({ summary: '更新账号状态' })
  @Post('status')
  async updateAccountStatus(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateAccountStatusDto,
  ) {
    const account = await this.accountService.getAccountById(body.id)
    if (!account || account.userId !== token.id) {
      throw new AppException(ResponseCode.AccountNotFound, 'The account does not exist.')
    }
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
    res.forEach((item) => {
      item.avatar = fileUtil.buildUrl(item.avatar)
    })
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
    @Body() body: AccountListByIdsDto,
  ) {
    const res = await this.accountService.getAccountListByIdsOfUser(token.id, body.ids)
    res.forEach((item) => {
      item.avatar = fileUtil.buildUrl(item.avatar)
    })
    return res
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
    const account = await this.accountService.getAccountById(param.id)
    if (!account || account.userId !== token.id) {
      throw new AppException(ResponseCode.AccountNotFound, 'The account does not exist.')
    }
    return this.accountService.deleteUserAccount(param.id, token.id)
  }

  @ApiOperation({ summary: '更新账户统计信息' })
  @Post('statistics/update')
  async updateAccountStatistics(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateAccountStatisticsDto,
  ) {
    const account = await this.accountService.getAccountById(body.id)
    if (!account || account.userId !== token.id) {
      throw new AppException(ResponseCode.AccountNotFound, '账号不存在')
    }
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
    const res = await this.accountService.listBySpaceIds(token.id, query.spaceIds)
    res.forEach((item) => {
      item.avatar = fileUtil.buildUrl(item.avatar)
    })
    return res
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
