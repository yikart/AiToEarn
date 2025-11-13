import { Module } from '@nestjs/common'
import { WxGzhApiService } from './wx-gzh.service'

@Module({
  providers: [WxGzhApiService],
  exports: [WxGzhApiService],
})
export class WxGzhApiModule {}
