import { Module } from '@nestjs/common'
import { WxGzhController } from './wxGzh.controller'
import { WxGzhService } from './wxGzh.service'
import { WxPlatController } from './wxPlat.controller'

@Module({
  imports: [],
  controllers: [WxGzhController, WxPlatController],
  providers: [WxGzhService],
  exports: [WxGzhService],
})
export class WxGzhModule {}
