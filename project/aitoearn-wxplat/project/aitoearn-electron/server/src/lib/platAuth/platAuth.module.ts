/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:27
 * @LastEditTime: 2025-02-25 09:47:37
 * @LastEditors: nevin
 * @Description: platAuth PlatAuth
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import wxConfig from '../../../config/wx.config';
import { PlatAuthWxGzhService } from './wxGzh.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [wxConfig], // 加载自定义配置项
    }),
  ],
  providers: [PlatAuthWxGzhService],
  exports: [PlatAuthWxGzhService],
})
export class PlatAuthModule {}
