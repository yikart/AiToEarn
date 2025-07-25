import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AccountGroupNatsApi } from '@transports/account/accountGroup.natsApi'
import { GetToken } from '@/auth/auth.guard'
import { TokenInfo } from '@/auth/interfaces/auth.interfaces'
import {
  CreateAccountGroupDto,
  DeleteAccountGroupDto,
  UpdateAccountGroupDto,
} from './dto/accountGroup.dto'

@ApiTags('账户组')
@Controller('accountGroup')
export class AccountGroupController {
  constructor(private readonly accountGroupNatsApi: AccountGroupNatsApi) {}

  @ApiOperation({ summary: '创建组' })
  @Post('create')
  // @ApiResult({ type: AccountGroup })
  async create(
    @GetToken() token: TokenInfo,
    @Body() body: CreateAccountGroupDto,
  ) {
    return this.accountGroupNatsApi.createGroup({
      userId: token.id,
      ...body,
    })
  }

  @ApiOperation({ summary: '更新组' })
  @Post('update')
  // @ApiResult({ type: AccountGroup })
  async updateGroup(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateAccountGroupDto,
  ) {
    const res = await this.accountGroupNatsApi.updateGroup(token.id, {
      ...body,
      userId: token.id,
    })
    return res
  }

  @ApiOperation({ summary: '删除账户组' })
  @Post('deletes')
  // @ApiResult({ type: AccountGroup })
  async deletes(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteAccountGroupDto,
  ) {
    return this.accountGroupNatsApi.deleteAccountGroup(body.ids, token.id)
  }

  @ApiOperation({ summary: '获取用户所有账户组' })
  @Get('getList')
  // @ApiResult({ type: [Account] })
  async getUserAccounts(@GetToken() token: TokenInfo) {
    const res = await this.accountGroupNatsApi.getAccountGroup(token.id)
    return res
  }
}
