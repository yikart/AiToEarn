/*
 * @Author: nevin
 * @Date: 2025-01-24 16:35:59
 * @LastEditTime: 2025-02-06 19:14:24
 * @LastEditors: nevin
 * @Description:
 */
import { Module } from '../core/decorators';
import { UserController } from './controller';
import { UserService } from './service';

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
