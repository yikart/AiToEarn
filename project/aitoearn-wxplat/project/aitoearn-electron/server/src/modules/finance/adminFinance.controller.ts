/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-03-02 23:45:48
 * @LastEditors: nevin
 * @Description: 管理员-财务
 */
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import {
  GetUserWalletRecordListByAdminDto,
  UpUserWalletRecordPul,
} from './dto/userWalletRecord.dto';
import { ObjectId } from 'mongodb';
import { UserService } from 'src/user/user.service';

@Controller('adminFinance')
export class AdminFinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly userService: UserService,
  ) {}

  // 获取用户账户信息
  @Get('userWallet/info/:userId')
  async getUserWalletInfoByUserId(@Param() param: { userId: string }) {
    const user = await this.userService.getUserInfoById(param.userId);
    if (!user) return null;

    return this.financeService.getUserWalletByUserId(
      new ObjectId(param.userId),
    );
  }

  // --------- userWalletRecord STR ---------
  // 获取用户账户记录列表
  @Get('userWalletRecord/list')
  async getUserWalletRecordList(
    @Query() query: GetUserWalletRecordListByAdminDto,
  ) {
    return this.financeService.getWalletRecordList(query);
  }

  // 提交记录发放
  @Post('userWalletRecord/submit/:id')
  async submitUserWalletRecord(
    @Param('id') id: string,
    @Body() body: UpUserWalletRecordPul,
  ) {
    return this.financeService.submitUserWalletRecord(id, body);
  }

  // 打款拒绝
  @Post('userWalletRecord/reject/:id')
  async rejectUserWalletRecord(
    @Param('id') id: string,
    @Body() body: UpUserWalletRecordPul,
  ) {
    return this.financeService.rejectUserWalletRecord(id, body);
  }
  // --------- userWalletRecord END ---------
}
