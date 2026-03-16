/*
 * @Author: zhangwei
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-06-09 16:11:36
 * @LastEditors: zhangwei
 * @Description: youtube
 */
import { Module } from '@nestjs/common'
import { YoutubeApiModule } from '../../libs/youtube/youtube-api.module'
import { ChannelSharedModule } from '../channel-shared.module'
import { YoutubeController } from './youtube.controller'
import { YoutubeService } from './youtube.service'

@Module({
  imports: [
    YoutubeApiModule,
    ChannelSharedModule,
  ],
  controllers: [YoutubeController],
  providers: [YoutubeService],
  exports: [YoutubeService],
})
export class YoutubeModule {}
