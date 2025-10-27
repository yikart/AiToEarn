/*
 * @Author: nevin
 * @Date: 2025-01-24 16:35:59
 * @LastEditTime: 2025-02-06 19:13:05
 * @LastEditors: nevin
 * @Description:
 */
import { Module } from '../core/decorators';
import { AccountController } from './controller';
import { AccountService } from './service';

@Module({
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
