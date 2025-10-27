/*
 * @Author: zhangwei
 * @Date: 2025-05-15 20:59:55
 * @LastEditTime: 2025-05-15 20:59:55
 * @LastEditors: zhangwei
 * @Description: youtube
 */
import { Module } from '@nestjs/common'
import { YoutubeApiService } from './youtubeApi.service'

@Module({
  imports: [],
  providers: [YoutubeApiService],
  exports: [YoutubeApiService],
})
export class YoutubeApiModule {}
