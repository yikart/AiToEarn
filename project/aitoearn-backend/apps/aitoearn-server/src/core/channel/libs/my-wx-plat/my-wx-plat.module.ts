import { Module } from '@nestjs/common'
import { MyWxPlatApiService } from './my-wx-plat.service'

@Module({
  imports: [],
  providers: [MyWxPlatApiService],
  exports: [MyWxPlatApiService],
})
export class MyWxPlatApiModule {}
