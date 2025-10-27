import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { Account } from '../../db/schema/account.schema';
import { ApiResult } from '../../common/decorators/api-result.decorator';
import {
  AccountIdDto,
  AccountListByIdsDto,
  AccountStatisticsDto,
  CreateAccountDto,
  UpdateAccountStatusDto,
  UpdateAccountStatisticsDto,
  GoogleLoginDto,
  DeleteAccountsDto,
  UpdateAccountDto,
} from './dto/account.dto';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { GetToken } from 'src/auth/auth.guard';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { Public } from '../../auth/auth.guard';
import { AccountGroup } from '../../db/schema/accountGroup.schema';
import { DeleteAccountGroupDto } from './accountGroup/dto/accountGroup.dto';

@ApiTags('账户')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @ApiOperation({ summary: '创建账号' })
  @Post('login')
  @ApiResult({ type: Account })
  async createOrUpdateAccount(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: CreateAccountDto,
  ) {
    return this.accountService.addOrUpdateAccount({
      userId: token.id,
      ...body,
    });
  }

  @ApiOperation({ summary: '创建或更新账号' })
  @Post('update')
  @ApiResult({ type: Account })
  async updateOrUpdateAccount(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: UpdateAccountDto,
  ) {
    return this.accountService.addOrUpdateAccount({
      userId: token.id,
      ...body,
    });
  }

  @ApiOperation({ summary: '更新账号状态' })
  @Post('status')
  @ApiResult({ type: Account })
  async updateAccountStatus(
    @Body(new ParamsValidationPipe()) body: UpdateAccountStatusDto,
  ) {
    return this.accountService.updateAccountStatus(body.id, body.status);
  }

  @ApiOperation({ summary: '获取账号信息' })
  @Get(':id')
  @ApiResult({ type: Account })
  async getAccountInfo(@Param(new ParamsValidationPipe()) param: AccountIdDto) {
    return this.accountService.getAccountById(param.id);
  }

  @ApiOperation({ summary: '获取用户所有账户' })
  @Get('list/all')
  @ApiResult({ type: [Account] })
  async getUserAccounts(@GetToken() token: TokenInfo) {
    return this.accountService.getAccounts(token.id);
  }

  @ApiOperation({ summary: '删除多个账户' })
  @Post('deletes')
  @ApiResult({ type: AccountGroup })
  async deletes(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: DeleteAccountsDto,
  ) {
    return this.accountService.deleteAccounts(body.ids, token.id);
  }

  @ApiOperation({ summary: '获取账户列表' })
  @Post('list/ids')
  @ApiResult({ type: Account })
  async getAccountListByIds(
    @GetToken() token: TokenInfo,
    @Query(new ParamsValidationPipe()) query: AccountListByIdsDto,
  ) {
    return this.accountService.getAccountListByIds(token.id, query.ids);
  }

  @ApiOperation({ summary: '获取账户总数' })
  @Get('count')
  @ApiResult({ type: Number })
  async getAccountCount(@GetToken() token: TokenInfo) {
    return this.accountService.getAccountCount(token.id);
  }

  @ApiOperation({ summary: '获取账户统计' })
  @Get('statistics')
  @ApiResult({ type: Account })
  async getAccountStatistics(
    @GetToken() token: TokenInfo,
    @Query(new ParamsValidationPipe()) query: AccountStatisticsDto,
  ) {
    return this.accountService.getAccountStatistics(token.id, query.type);
  }

  @ApiOperation({ summary: '删除账户' })
  @Post('delete/:id')
  @ApiResult({ type: Boolean })
  async deleteAccount(
    @GetToken() token: TokenInfo,
    @Param(new ParamsValidationPipe()) param: AccountIdDto,
  ) {
    return this.accountService.deleteAccount(param.id, token.id);
  }

  @ApiOperation({ summary: '更新账户统计信息' })
  @Post('statistics/update')
  @ApiResult({ type: Boolean })
  async updateAccountStatistics(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: UpdateAccountStatisticsDto,
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
    } = body;
    return this.accountService.updateAccountStatistics(
      id,
      fansCount,
      readCount,
      likeCount,
      collectCount,
      commentCount,
      income,
      workCount,
    );
  }

  // @ApiOperation({ summary: 'Google登录' })
  // @Post('login/google')
  // @Public()
  // @ApiResult({ type: Account })
  // async googleLogin(
  //   @Body(new ParamsValidationPipe()) body: GoogleLoginDto,
  // ) {
  //   // console.log(body.clientId, body.credential)
  //   return this.accountService.googleLogin(body.clientId, body.credential);
  // }
}
