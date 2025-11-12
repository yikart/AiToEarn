import { Body, Controller, Get, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { AppException, ResponseCode } from '@yikart/common'
import * as _ from 'lodash'
import { AccountGroupService } from './accountGroup.service'
import { CreateAccountGroupDto, DeleteAccountGroupDto, SortRankDto, UpdateAccountGroupDto } from './dto/accountGroup.dto'

@ApiTags('Account Groups')
@Controller('accountGroup')
export class AccountGroupController {
  constructor(
    private readonly accountGroupService: AccountGroupService,
  ) {}

  @ApiOperation({ summary: 'Create Group' })
  @Post('create')
  async create(
    @GetToken() token: TokenInfo,
    @Body() body: CreateAccountGroupDto,
  ) {
    return this.accountGroupService.createAccountGroup({
      userId: token.id,
      ...body,
    })
  }

  @ApiOperation({ summary: 'Update Group' })
  @Post('update')
  async updateGroup(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateAccountGroupDto,
  ) {
    const group = await this.accountGroupService.findOneById(body.id)
    if (!group || group.userId !== token.id) {
      throw new AppException(ResponseCode.AccountGroupNotFound)
    }

    const res = await this.accountGroupService.updateAccountGroup(
      group,
      body,
    )
    return res
  }

  @ApiOperation({ summary: 'Delete Account Group' })
  @Post('deletes')
  async deletes(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteAccountGroupDto,
  ) {
    return this.accountGroupService.deleteAccountGroup(body.ids, token.id)
  }

  @ApiOperation({ summary: 'Get All Account Groups for User' })
  @Get('getList')
  async getUserAccounts(@GetToken() token: TokenInfo) {
    const res = await this.accountGroupService.getAccountGroup(token.id)
    const sortedRes = _.sortBy(res, 'rank')
    return sortedRes
  }

  @ApiOperation({ summary: 'Update Sorting' })
  @Put('sortRank')
  async sortRank(
    @GetToken() token: TokenInfo,
    @Body() body: SortRankDto,
  ) {
    return this.accountGroupService.sortRank(token.id, body.list)
  }
}
