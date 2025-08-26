import { Module } from '@nestjs/common'
import { WxPlatApiService } from './wxPlatApi.service'

@Module({
  imports: [],
  providers: [WxPlatApiService],
  exports: [WxPlatApiService],
})
export class WxPlatApiModule {}
