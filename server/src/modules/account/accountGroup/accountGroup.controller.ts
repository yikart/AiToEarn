import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountGroupService } from './accountGroup.service';
import { ApiResult } from '../../../common/decorators/api-result.decorator';
import { AccountGroup } from '../../../db/schema/accountGroup.schema';
import { GetToken } from '../../../auth/auth.guard';
import { TokenInfo } from '../../../auth/interfaces/auth.interfaces';
import { ParamsValidationPipe } from '../../../validation.pipe';
import {
  CreateAccountGroupDto,
  DeleteAccountGroupDto,
  UpdateAccountGroupDto,
} from './dto/accountGroup.dto';
import { Account } from '../../../db/schema/account.schema';

@ApiTags('账户组')
@Controller('accountGroup')
export class AccountGroupController {
  constructor(private readonly accountGroupService: AccountGroupService) {}

  @ApiOperation({ summary: '创建组' })
  @Post('create')
  @ApiResult({ type: AccountGroup })
  async create(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: CreateAccountGroupDto,
  ) {
    return this.accountGroupService.addOrUpdateAccountGroup({
      userId: token.id,
      ...body,
    });
  }

  @ApiOperation({ summary: '更新组' })
  @Post('update')
  @ApiResult({ type: AccountGroup })
  async update(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: UpdateAccountGroupDto,
  ) {
    return this.accountGroupService.addOrUpdateAccountGroup({
      userId: token.id,
      ...body,
    });
  }

  @ApiOperation({ summary: '删除账户组' })
  @Post('deletes')
  @ApiResult({ type: AccountGroup })
  async deletes(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: DeleteAccountGroupDto,
  ) {
    return this.accountGroupService.deleteAccountGroup(body.ids, token.id);
  }

  @ApiOperation({ summary: '获取用户所有账户组' })
  @Get('getList')
  @ApiResult({ type: [Account] })
  async getUserAccounts(@GetToken() token: TokenInfo) {
    return this.accountGroupService.getAccountGroup(token.id);
  }
}
