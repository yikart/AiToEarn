/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:27
 * @LastEditTime: 2025-02-25 09:47:37
 * @LastEditors: nevin
 * @Description: bilibili Bilibili
 */
import { Module } from '@nestjs/common'
import { BilibiliApiService } from './bilibiliApi.service'

@Module({
  imports: [],
  providers: [BilibiliApiService],
  exports: [BilibiliApiService],
})
export class BilibiliApiModule {}
