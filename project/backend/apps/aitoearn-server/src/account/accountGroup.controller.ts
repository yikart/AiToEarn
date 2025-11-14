import { Body, Controller, Get, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode } from '@yikart/common'
import * as _ from 'lodash'
import { AccountGroupService } from './accountGroup.service'
import { CreateAccountGroupDto, DeleteAccountGroupDto, SortRankDto, UpdateAccountGroupDto } from './dto/accountGroup.dto'

@ApiTags('OpenSource/Home/AccountGroup')
@Controller('accountGroup')
export class AccountGroupController {
  constructor(
    private readonly accountGroupService: AccountGroupService,
  ) {}

  @ApiDoc({
    summary: 'Create Account Group',
    body: CreateAccountGroupDto.schema,
  })
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

  @ApiDoc({
    summary: 'Update Account Group',
    body: UpdateAccountGroupDto.schema,
  })
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

  @ApiDoc({
    summary: 'Delete Account Groups',
    body: DeleteAccountGroupDto.schema,
  })
  @Post('deletes')
  async deletes(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteAccountGroupDto,
  ) {
    return this.accountGroupService.deleteAccountGroup(body.ids, token.id)
  }

  @ApiDoc({
    summary: 'List Account Groups',
  })
  @Get('getList')
  async getUserAccounts(@GetToken() token: TokenInfo) {
    const res = await this.accountGroupService.getAccountGroup(token.id)
    const sortedRes = _.sortBy(res, 'rank')
    return sortedRes
  }

  @ApiDoc({
    summary: 'Update Account Group Sort Order',
    body: SortRankDto.schema,
  })
  @Put('sortRank')
  async sortRank(
    @GetToken() token: TokenInfo,
    @Body() body: SortRankDto,
  ) {
    return this.accountGroupService.sortRank(token.id, body.list)
  }
}
