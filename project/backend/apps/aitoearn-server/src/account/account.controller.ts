import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode } from '@yikart/common'
import { fileUtil } from '../common/utils/file.util'
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

@ApiTags('OpenSource/Home/Account')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @ApiDoc({
    summary: 'Create Account',
    body: CreateAccountDto.schema,
  })
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

  @ApiDoc({
    summary: 'Update Account',
    body: UpdateAccountDto.schema,
  })
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

  @ApiDoc({
    summary: 'Update Account Status',
    body: UpdateAccountStatusDto.schema,
  })
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

  @ApiDoc({
    summary: 'Get Account Detail',
  })
  @Get(':id')
  async getAccountInfo(@Param() param: AccountIdDto) {
    return this.accountService.getAccountById(param.id)
  }

  @ApiDoc({
    summary: 'List All Accounts of Current User',
  })
  @Get('list/all')
  async getUserAccounts(@GetToken() token: TokenInfo) {
    const res = await this.accountService.getUserAccounts(token.id)
    res.forEach((item) => {
      item.avatar = fileUtil.buildUrl(item.avatar)
    })
    return res
  }

  @ApiDoc({
    summary: 'Delete Multiple Accounts',
    body: DeleteAccountsDto.schema,
  })
  @Post('deletes')
  async deletes(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteAccountsDto,
  ) {
    return this.accountService.deleteUserAccounts(body.ids, token.id)
  }

  @ApiDoc({
    summary: 'Get Account List',
    body: AccountListByIdsDto.schema,
  })
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

  @ApiDoc({
    summary: 'Get Account Count',
  })
  @Get('count')
  async getAccountCount(@GetToken() token: TokenInfo) {
    return this.accountService.getUserAccountCount(token.id)
  }

  @ApiDoc({
    summary: 'Get Account Statistics',
    query: AccountStatisticsDto.schema,
  })
  @Get('statistics')
  async getAccountStatistics(
    @GetToken() token: TokenInfo,
    @Query() query: AccountStatisticsDto,
  ) {
    return this.accountService.getAccountStatistics(token.id, query.type)
  }

  @ApiDoc({
    summary: 'Delete Account',
  })
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

  @ApiDoc({
    summary: 'Update Account Statistics',
    body: UpdateAccountStatisticsDto.schema,
  })
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

  @ApiDoc({
    summary: 'Get Account List by Space Ids',
    query: AccountListBySpaceIdsDto.schema,
  })
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

  @ApiDoc({
    summary: 'Update Sort Rank',
    body: SortRankDto.schema,
  })
  @Put('sortRank')
  async sortRank(
    @GetToken() token: TokenInfo,
    @Body() body: SortRankDto,
  ) {
    return this.accountService.sortRank(token.id, body.groupId, body.list)
  }
}
