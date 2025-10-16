import { Body, Controller, Get, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import * as _ from 'lodash'
import { GetToken } from '../auth/auth.guard'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { CloudSpaceService } from '../cloud/core/cloud-space'
import { AccountGroupService } from './accountGroup.service'
import { CreateAccountGroupDto, DeleteAccountGroupDto, SortRankDto, UpdateAccountGroupDto } from './dto/accountGroup.dto'

@ApiTags('账户组')
@Controller('accountGroup')
export class AccountGroupController {
  constructor(
    private readonly accountGroupService: AccountGroupService,
    private readonly cloudSpaceService: CloudSpaceService,
  ) {}

  @ApiOperation({ summary: '创建组' })
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

  @ApiOperation({ summary: '更新组' })
  @Post('update')
  async updateGroup(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateAccountGroupDto,
  ) {
    const res = await this.accountGroupService.updateAccountGroup(token.id, {
      ...body,
      userId: token.id,
    })
    return res
  }

  @ApiOperation({ summary: '删除账户组' })
  @Post('deletes')
  async deletes(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteAccountGroupDto,
  ) {
    return this.accountGroupService.deleteAccountGroup(body.ids, token.id)
  }

  @ApiOperation({ summary: '获取用户所有账户组' })
  @Get('getList')
  async getUserAccounts(@GetToken() token: TokenInfo) {
    const res = await this.accountGroupService.getAccountGroup(token.id)
    const cloudSpaces = await this.cloudSpaceService.listCloudSpacesByUserId({
      userId: token.id,
    })
    const cloudSpacesMap = _.keyBy(cloudSpaces, 'accountGroupId')

    return res.map((ag: { id: string | number }) => Object.assign(ag, { cloudSpace: cloudSpacesMap[ag.id] }))
  }

  @ApiOperation({ summary: '更新排序' })
  @Put('sortRank')
  async sortRank(
      @GetToken() token: TokenInfo,
      @Body() body: SortRankDto,
  ) {
    return this.accountGroupService.sortRank(token.id, body.list)
  }
}
