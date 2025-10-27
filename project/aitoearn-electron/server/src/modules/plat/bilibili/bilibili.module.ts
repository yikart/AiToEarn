/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-04-27 17:36:19
 * @LastEditors: nevin
 * @Description: bilibili Bilibili B站模块
 */
import { Module } from '@nestjs/common';
import { BilibiliController } from './bilibili.controller';
import { BilibiliService } from './bilibili.service';
import { ConfigModule } from '@nestjs/config';
import bilibiliConfig from 'config/bilibili.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [bilibiliConfig],
    }),
  ],
  controllers: [BilibiliController],
  providers: [BilibiliService],
  exports: [BilibiliService],
})
export class BilibiliModule {}
