/*
 * @Author: AI Assistant
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: AI Assistant
 * @Description: TikTok Platform Module
 */
import { Module } from '@nestjs/common'
import { TiktokController } from './tiktok.controller'
import { TiktokService } from './tiktok.service'

@Module({
  imports: [],
  controllers: [TiktokController],
  providers: [TiktokService],
  exports: [TiktokService],
})
export class TiktokModule {}
