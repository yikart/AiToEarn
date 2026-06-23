import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import {
  ChannelAccountGroupCreateDto,
  ChannelAccountGroupDeleteQueryDto,
  ChannelAccountGroupRankUpdateDto,
  ChannelAccountGroupUpdateDto,
} from './account-group.dto'
import { AccountGroupService } from './account-group.service'
import { ChannelAccountGroupVo } from './account-group.vo'

@ApiTags('Channels/AccountGroups')
@Controller({ path: '/channels/account-groups', version: '2' })
export class AccountGroupsController {
  constructor(private readonly accountGroupService: AccountGroupService) {}

  @ApiDoc({
    summary: '账号分组列表',
    response: [ChannelAccountGroupVo],
  })
  @Get('/')
  async list(@GetToken() token: TokenInfo) {
    return (await this.accountGroupService.list(token.id))
      .map(group => ChannelAccountGroupVo.create(group))
  }

  @ApiDoc({
    summary: '创建账号分组',
    body: ChannelAccountGroupCreateDto.schema,
    response: ChannelAccountGroupVo,
  })
  @Post('/')
  async create(
    @GetToken() token: TokenInfo,
    @Body() body: ChannelAccountGroupCreateDto,
  ) {
    return ChannelAccountGroupVo.create(await this.accountGroupService.create(token.id, body))
  }

  @ApiDoc({
    summary: '删除账号分组',
    query: ChannelAccountGroupDeleteQueryDto.schema,
  })
  @Delete('/')
  async deleteMany(
    @GetToken() token: TokenInfo,
    @Query() query: ChannelAccountGroupDeleteQueryDto,
  ) {
    return this.accountGroupService.deleteMany(token.id, query.ids)
  }

  @ApiDoc({
    summary: '更新账号分组',
    body: ChannelAccountGroupUpdateDto.schema,
    response: ChannelAccountGroupVo,
  })
  @Patch('/:groupId')
  async update(
    @GetToken() token: TokenInfo,
    @Param('groupId') groupId: string,
    @Body() body: ChannelAccountGroupUpdateDto,
  ) {
    return ChannelAccountGroupVo.create(await this.accountGroupService.update(token.id, groupId, body))
  }

  @ApiDoc({
    summary: '更新分组内账号排序',
    body: ChannelAccountGroupRankUpdateDto.schema,
  })
  @Patch('/:groupId/accounts/rank')
  async sortAccounts(
    @GetToken() token: TokenInfo,
    @Param('groupId') groupId: string,
    @Body() body: ChannelAccountGroupRankUpdateDto,
  ) {
    return this.accountGroupService.sortAccounts(token.id, groupId, body.list)
  }
}
