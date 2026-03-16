import { Module } from '@nestjs/common'
import { WxPlatApiService } from './wx-plat.service'

@Module({
  imports: [],
  providers: [WxPlatApiService],
  exports: [WxPlatApiService],
})
export class WxPlatApiModule {}
