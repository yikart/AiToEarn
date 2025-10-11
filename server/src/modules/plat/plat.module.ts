/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-04-27 17:36:19
 * @LastEditors: nevin
 * @Description: plat Plat 三方平台模块
 */
import { Module } from '@nestjs/common';
import { BilibiliModule } from './bilibili/bilibili.module';
import { GzhModule } from './gzh/gzh.module';
import { GoogleModule } from './google/google.module';
import { YoutubeModule } from './youtube/youtube.module';
import { TwitterModule } from './twitter/twitter.module';
import { TiktokModule } from './tiktok/tiktok.module';

@Module({
  imports: [BilibiliModule, GzhModule, GoogleModule, YoutubeModule, TwitterModule, TiktokModule],
})
export class PlatModule {}
