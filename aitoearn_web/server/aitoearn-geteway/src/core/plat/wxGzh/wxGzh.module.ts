import { Module } from '@nestjs/common'
import { WxGzhController } from './wxGzh.controller'
import { WxGzhService } from './wxGzh.service'

@Module({
  imports: [],
  controllers: [WxGzhController],
  providers: [WxGzhService],
  exports: [WxGzhService],
})
export class WxGzhModule {}
