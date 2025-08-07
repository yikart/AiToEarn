import { Module } from '@nestjs/common'
import { MyWxPlatApiService } from './myWxPlatApi.service';

@Module({
  imports: [],
  providers: [MyWxPlatApiService],
  exports: [MyWxPlatApiService],
})
export class MyWxPlatApiModule {}
