/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2025-04-14 19:22:41
 * @LastEditors: nevin
 * @Description: 其他模块
 */
import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { TestController } from './test.controller'
import { TestService } from './test.service'

@Module({
  imports: [UserModule],
  providers: [TestService],
  controllers: [TestController],
})
export class TestModule {}
