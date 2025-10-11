/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-03-25 09:43:22
 * @LastEditors: nevin
 * @Description: 用户财产模块
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import {
  UserWalletAccount,
  UserWalletAccountSchema,
} from 'src/db/schema/userWalletAccount.shema';
import {
  UserWalletRecord,
  UserWalletRecordSchema,
} from 'src/db/schema/userWalletRecord.shema';
import { AdminFinanceController } from './adminFinance.controller';
import { UserWallet, UserWalletSchema } from 'src/db/schema/userWallet.shema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserWalletAccount.name, schema: UserWalletAccountSchema },
      { name: UserWalletRecord.name, schema: UserWalletRecordSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
    ]),
  ],
  controllers: [FinanceController, AdminFinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
