/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2025-04-14 19:22:41
 * @LastEditors: nevin
 * @Description: 配置模块
 */
import { Global, Module } from '@nestjs/common'
import { AppConfigController } from './app-config.controller'
import { AppConfigService } from './app-config.service'

@Global()
@Module({
  imports: [
  ],
  providers: [AppConfigService],
  controllers: [AppConfigController],
})
export class AppConfigModule {}
