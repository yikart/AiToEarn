import { Module } from '@nestjs/common'
import { WxGzhApiService } from './wxGzhApi.service'

@Module({
  providers: [WxGzhApiService],
  exports: [WxGzhApiService],
})
export class WxGzhApiModule {}
