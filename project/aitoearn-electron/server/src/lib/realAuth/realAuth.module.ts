/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:27
 * @LastEditTime: 2025-02-25 09:47:37
 * @LastEditors: nevin
 * @Description: realAuth RealAuth
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import realAuth from '../../../config/realAuth.config';
import { AlicloudRealAuthService } from './realAuth.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [realAuth], // 加载自定义配置项
    }),
  ],
  providers: [AlicloudRealAuthService],
  exports: [AlicloudRealAuthService],
})
export class RealAuthModule {}
