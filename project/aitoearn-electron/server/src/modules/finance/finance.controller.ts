/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 14:07:03
 * @LastEditors: nevin
 * @Description: 财务
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResult } from '../../common/decorators/api-result.decorator';
import { FinanceService } from './finance.service';
import { GetToken, Public } from '../../auth/auth.guard';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { CreateUserWalletAccountDto } from './dto/userWalletAccount.dto';
import { UserWalletAccount } from 'src/db/schema/userWalletAccount.shema';
import {
  CreateUserWalletRecordDto,
  GetUserWalletRecordListDto,
} from './dto/userWalletRecord.dto';
import {
  UserWalletRecordStatus,
  UserWalletRecordType,
} from 'src/db/schema/userWalletRecord.shema';
import { UserWallet } from 'src/db/schema/userWallet.shema';
import { ObjectId } from 'mongodb';
import { AppHttpException } from 'src/filters/http-exception.filter';
import { ErrHttpBack } from 'src/filters/http-exception.back-code';
import { RealAuthService } from '../tools/realAuth.service';
import { SceneType } from 'src/db/schema/realAuth.schema';

@ApiTags('finance - 财务')
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly realAuthService: RealAuthService,
  ) {}

  // --------- userWalletAccount STR ---------
  @ApiOperation({ summary: '发送创建账户的短信码' })
  @ApiResult({ type: String })
  @Public()
  @Post('userWalletAccount/phoneCode/:phone')
  async postCreateUserWalletAccountCode(@Param('phone') phone: string) {
    return await this.financeService.postCreateUserWalletAccountCode(phone);
  }

  @ApiOperation({ summary: '创建用户钱包账户' })
  @Post('userWalletAccount')
  @ApiResult({ type: UserWalletAccount })
  async createUserWalletAccount(
    @GetToken() token: TokenInfo,
    @Body() body: CreateUserWalletAccountDto,
  ) {
    // 验证身份证
    const res = await this.realAuthService.realNameAuth(
      token.id,
      body.cardNum,
      body.userName,
      SceneType.UserWallet,
    );
    if (!res)
      throw new AppHttpException(ErrHttpBack.err_approve_idcard_invalid);

    return await this.financeService.createUserWalletAccount(token.id, body);
  }

  @ApiOperation({ summary: '获取用户钱包账户列表' })
  @Get('userWalletAccount/list')
  @ApiResult({ type: [UserWalletAccount] })
  async getUserWalletAccountList(@GetToken() token: TokenInfo) {
    return this.financeService.getUserWalletAccountList(token.id);
  }

  @ApiOperation({ summary: '删除用户钱包账户' })
  @Delete('userWalletAccount/delete/:id')
  @ApiResult({ type: String })
  async deleteUserWalletAccount(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    return await this.financeService.deleteUserWalletAccount(token.id, id);
  }
  // --------- userWalletAccount END ---------

  // --------- userWalletRecord STR ---------
  @ApiOperation({ summary: '创建用户提现记录-提交提现' })
  @Post('userWalletRecord')
  @ApiResult({ type: UserWalletAccount })
  async addUserWalletRecord(
    @GetToken() token: TokenInfo,
    @Body() body: CreateUserWalletRecordDto,
  ) {
    const { walletAccountId, balance } = body;

    const walletAccount =
      await this.financeService.getUserWalletAccountById(walletAccountId);

    if (!walletAccount)
      throw new AppHttpException(ErrHttpBack.wallet_account_no_had);

    // 获取余额
    const userWallet = await this.financeService.getUserWalletByUserId(
      new ObjectId(token.id),
    );

    // 获取待提现金额
    const waitCount = await this.financeService.getDoingWalletRecordCount(
      token.id,
    );

    // 计算可用余额
    const availableBalance =
      parseFloat(userWallet.balance.toString()) - waitCount;

    if (!userWallet || availableBalance < balance)
      throw new AppHttpException(ErrHttpBack.wallet_balance_no_enough);

    const res = await this.financeService.createUserWalletRecord(
      token.id,
      walletAccount,
      {
        type: UserWalletRecordType.WITHDRAW,
        balance,
        status: UserWalletRecordStatus.WAIT,
      },
    );

    return res;
  }

  @ApiOperation({ summary: '获取用户账户记录列表' })
  @Get('userWalletRecord/list')
  @ApiResult({ type: [UserWalletAccount] })
  async getUserWalletRecordList(
    @GetToken() token: TokenInfo,
    @Query() query: GetUserWalletRecordListDto,
  ) {
    return this.financeService.getUserWalletRecordList(token.id, query);
  }

  @ApiOperation({ summary: '获取用户钱包信息' })
  @Get('userWallet/info')
  @ApiResult({ type: UserWallet })
  async getUserWalletInfo(@GetToken() token: TokenInfo) {
    return this.financeService.getUserWalletByUserId(new ObjectId(token.id));
  }
  // --------- userWalletRecord END ---------
}
